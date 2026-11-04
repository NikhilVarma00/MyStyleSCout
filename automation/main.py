import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus, urlparse, unquote, parse_qs

import requests
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus, urlparse, unquote, parse_qs

import requests
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

load_dotenv(BASE_DIR / ".env")

CUELINKS_API_KEY = os.getenv("CUELINKS_API_KEY", "").strip()
CUELINKS_CONVERT_URL = "https://developers.cuelinks.com/pub_api/v3/links/convert"
HEADLESS = os.getenv("HEADLESS", "0").strip().lower() in {"1", "true", "yes"}
AMAZON_TAG = os.getenv("AMAZON_AFFILIATE_TAG", "").strip()

LINKS_FILE = BASE_DIR / "links.txt"
QUEUE_FILE = OUTPUT_DIR / "candidates_queue.json"
DELAY_BETWEEN_PRODUCTS = 15  # seconds

GENERIC_WORDS = {
    "men", "mens", "man", "women", "womens", "woman", "ladies", "lady",
    "boys", "girls", "boy", "girl", "kids", "kid", "unisex", "adult",
    "shoes", "shoe", "sneakers", "sneaker", "footwear", "sports", "sport",
    "running", "runner", "walking", "walk", "casual", "training", "trainers",
    "athletic", "fashion", "lifestyle", "comfort", "comfortable",
    "slip", "on", "lace", "up", "low", "top", "high", "mid", "original",
    "new", "latest", "official", "best", "sale", "online",
    "multicolor", "multi", "colour", "color", "edition", "version", "pair",
    "pairs", "size", "sizes", "for", "with", "and", "the", "a", "an", "of",
    "from", "by", "india", "indian",
    "matte", "stylish", "trendy", "premium", "quality", "durable",
    "breathable", "lightweight", "everyday", "daily", "wear",
    "gym", "workout", "buy", "flipkart", "myntra", "amazon",
}

BAD_URL_PARTS = {
    "search", "login", "account", "cart", "wishlist", "help", "about", "terms",
    "reviews", "collections",
}

BAD_IMAGE_MARKERS = (
    "play-button", "play_button", "play-icon", "play_icon",
    "video-thumbnail", "video_thumbnail", "pkdp-play",
    "360_icon", "-play-", "sprite", "grey-pixel", "transparent-pixel",
)

KNOWN_COLORS = {
    "black", "white", "beige", "navy", "blue", "red", "green", "grey", "gray",
    "brown", "tan", "cream", "olive", "maroon", "purple", "pink", "yellow",
    "orange", "silver", "gold", "ivory", "khaki", "teal",
}

MAX_CANDIDATES_PER_RETAILER = 8


# ============================================================
# HELPERS
# ============================================================

def clean_text(value: str) -> str:
    value = value or ""
    value = unquote(value)
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()

def tokens(value: str):
    return clean_text(value).split()

def dedupe(items):
    seen, out = set(), []
    for item in items:
        key = item if isinstance(item, str) else json.dumps(item, sort_keys=True)
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out

def parse_money(text: str):
    if not text:
        return None
    text = text.replace(",", "")
    for match in re.findall(r"(?:₹|Rs\.?\s*)?(\d{2,7}(?:\.\d{1,2})?)", text):
        try:
            v = float(match)
            if 50 <= v <= 1000000:
                return int(round(v))
        except ValueError:
            pass
    return None

def extract_colors_from_text(text: str):
    if not text:
        return set()
    return {c for c in KNOWN_COLORS if c in set(clean_text(text).split())}

def extract_colors_from_url_slug(url: str):
    if not url:
        return set()
    url = unquote(url).lower()
    slug = url.split("/")[-1] if "/" in url else url
    slug = re.sub(r"[^a-z0-9]+", " ", slug)
    return {c for c in KNOWN_COLORS if c in set(slug.split())}

def extract_gender_from_text(text: str):
    if not text:
        return None
    words = set(clean_text(text).split())
    if any(w in words for w in ("women", "womens", "woman", "ladies", "lady")):
        return "women"
    if any(w in words for w in ("men", "mens", "man")):
        return "men"
    if "unisex" in words:
        return "unisex"
    return None

def model_tokens(title: str, brand: str, url_slug: str = ""):
    brand_words = set(tokens(brand))
    combined = f"{title} {url_slug}"
    out = []
    seen = set()
    for t in tokens(combined):
        if t in brand_words or t in GENERIC_WORDS:
            continue
        if t in seen:
            continue
        if len(t) == 1 and not t.isdigit():
            continue
        if re.fullmatch(r"\d{1,2}", t) or re.fullmatch(r"\d+[a-z]", t) or len(t) >= 2:
            out.append(t)
            seen.add(t)
    return out[:8]

def similarity_score(amazon_title, amazon_brand, candidate_title, amazon_slug=""):
    a_brand = clean_text(amazon_brand)
    c = clean_text(candidate_title)
    if not a_brand or a_brand not in c:
        return 0
    core = model_tokens(amazon_title, amazon_brand, amazon_slug)
    if not core:
        return 50  
    matched = [t for t in core if t in c.split()]
    if not matched:
        return 30   
    if len(core) >= 3:
        score = 60 + (len(matched) / len(core)) * 40
    elif len(core) == 2:
        score = 70 + (len(matched) / len(core)) * 30
    else:
        score = 85
    return min(int(score), 100)

def safe_goto(page, url, timeout=45000, attempts=2):
    last = None
    for attempt in range(1, attempts + 1):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            return True
        except Exception as exc:
            last = exc
            if attempt < attempts:
                time.sleep(2)
    print(f"  ! Could not open page: {type(last).__name__}: {last}")
    return False

def text_from_selectors(page, selectors):
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            if locator.count() and locator.is_visible(timeout=1000):
                text = locator.inner_text(timeout=2000).strip()
                if text:
                    return text
        except Exception:
            continue
    return ""

def get_url_slug(url):
    try:
        path = urlparse(unquote(url)).path
        parts = [p for p in path.split("/") if p and p not in ("dp", "gp", "product")]
        best = ""
        for p in parts:
            if re.fullmatch(r"[A-Z0-9]{10}", p):
                continue
            if len(p) > len(best):
                best = p
        return best
    except Exception:
        return ""


# ============================================================
# AMAZON
# ============================================================

def extract_amazon(page, original_url):
    asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", original_url, re.I)
    if not asin_match:
        raise RuntimeError("Could not find ASIN in Amazon URL.")
    asin = asin_match.group(1).upper()

    clean_url = f"https://www.amazon.in/dp/{asin}"

    if not safe_goto(page, clean_url, timeout=60000, attempts=3):
        raise RuntimeError(f"Amazon page could not be opened: {asin}")

    page.wait_for_timeout(2500)

    title = text_from_selectors(page, ["#productTitle", "h1.a-size-large", "h1"])
    if not title:
        title = page.locator('meta[property="og:title"]').get_attribute("content") or ""
    title = re.sub(r"\s+", " ", title).strip()

    brand = ""
    byline = text_from_selectors(page, ["#bylineInfo", "a#bylineInfo"])
    if byline:
        brand = re.sub(r"^Visit the\s+|\s+Store$", "", byline, flags=re.I).strip()
    if not brand:
        brand = (title.split() or [""])[0]

    price = parse_money(text_from_selectors(page, [
        "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
        "#corePrice_feature_div .a-price .a-offscreen",
        "#priceblock_dealprice",
        "#priceblock_ourprice",
        "#priceblock_saleprice",
        "span.a-price .a-offscreen",
    ]))

    old_price = parse_money(text_from_selectors(page, [
        "#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen",
        "span.a-price.a-text-price .a-offscreen",
    ]))

    gallery = []
    try:
        dynamic = page.locator("#landingImage").get_attribute("data-a-dynamic-image")
        if dynamic:
            gallery.extend(json.loads(dynamic).keys())
    except Exception:
        pass
    try:
        for img in page.locator("#altImages img").all():
            for attr in ("data-old-hires", "src"):
                v = img.get_attribute(attr)
                if v and "m.media-amazon.com/images/" in v:
                    gallery.append(v)
                    break
    except Exception:
        pass
    try:
        og = page.locator('meta[property="og:image"]').get_attribute("content")
        if og:
            gallery.append(og)
    except Exception:
        pass

    normalized = []
    for url in gallery:
        if not url:
            continue
        if any(m in url.lower() for m in BAD_IMAGE_MARKERS):
            continue
        url = re.sub(r"\._[A-Za-z0-9,]+_\.(jpg|jpeg|png|webp)$", r".\1", url, flags=re.I)
        url = url.split("?")[0]
        if "m.media-amazon.com/images/" not in url:
            continue
        filename = url.rsplit("/", 1)[-1].lower()
        if any(m in filename for m in BAD_IMAGE_MARKERS):
            continue
        normalized.append(url)

    gallery = dedupe(normalized)
    if not gallery:
        raise RuntimeError(f"No images found for {asin}.")
    if price is None:
        raise RuntimeError(f"Could not detect price for {asin}.")
    if old_price is None or old_price < price:
        old_price = price
    discount = round((1 - price / old_price) * 100) if old_price else 0

    url_slug = get_url_slug(original_url) or get_url_slug(clean_url)
    amazon_colors = extract_colors_from_url_slug(url_slug) | extract_colors_from_text(title)
    amazon_gender = extract_gender_from_text(url_slug) or extract_gender_from_text(title)

    if AMAZON_TAG:
        affiliate_url = f"https://www.amazon.in/dp/{asin}?tag={AMAZON_TAG}"
    else:
        affiliate_url = original_url

    return {
        "asin": asin,
        "url": affiliate_url,
        "slug": url_slug,
        "brand": brand,
        "name": title,
        "price": price,
        "oldPrice": old_price,
        "discount": discount,
        "image": gallery[0],
        "gallery": gallery,
        "colors": sorted(amazon_colors),
        "gender": amazon_gender,
    }


# ============================================================
# RETAILER SEARCH
# ============================================================

def candidate_queries(product):
    brand = product["brand"]
    title = product["name"]
    url_slug = product.get("slug", "")
    core = model_tokens(title, brand, url_slug)

    queries = []
    if core:
        queries.append(f"{brand} {' '.join(core[:3])}")
    if core and len(core) > 3:
        queries.append(f"{brand} {' '.join(core)}")
    queries.append(title[:80])

    return dedupe(queries)[:3]

def search_via_duckduckgo(page, retailer, query, limit=15):
    site = "flipkart.com" if retailer == "Flipkart" else "myntra.com"
    search_url = "https://html.duckduckgo.com/html/?q=" + quote_plus(f"site:{site} {query}")
    if not safe_goto(page, search_url, timeout=30000, attempts=2):
        return []
    page.wait_for_timeout(1800)

    out = []
    try:
        for a in page.locator("a.result__a").all():
            href = a.get_attribute("href") or ""
            title = (a.inner_text() or "").strip()
            if "uddg=" in href:
                qs = parse_qs(urlparse(href).query)
                if "uddg" in qs:
                    href = unquote(qs["uddg"][0])
            if not href.startswith("http") or site not in href:
                continue
            if retailer == "Flipkart" and "/p/" not in href:
                continue
            if retailer == "Myntra" and "/buy" not in href:
                if not re.search(r"/\d{6,}", href):
                    continue
            if any(f"/{bad}" in href.lower() for bad in BAD_URL_PARTS):
                continue
            if title and len(title) > 5:
                out.append({"title": title, "url": href})
                if len(out) >= limit:
                    break
    except Exception:
        pass
    return out

def scrape_product_page(page, retailer, url, fallback_title=""):
    if not safe_goto(page, url, timeout=40000, attempts=2):
        return None
    page.wait_for_timeout(2500)

    title = ""
    for sel in ['meta[property="og:title"]', "h1"]:
        try:
            loc = page.locator(sel).first
            if loc.count():
                title = (loc.get_attribute("content") if sel.startswith("meta") else loc.inner_text()) or ""
                if title:
                    break
        except Exception:
            pass
    if not title:
        title = fallback_title

    price = None
    try:
        for script in page.locator('script[type="application/ld+json"]').all():
            try:
                data = json.loads(script.inner_text())
                for obj in (data if isinstance(data, list) else [data]):
                    if not isinstance(obj, dict):
                        continue
                    offers = obj.get("offers")
                    offer_list = [offers] if isinstance(offers, dict) else (offers if isinstance(offers, list) else [])
                    for offer in offer_list:
                        if not isinstance(offer, dict):
                            continue
                        v = offer.get("price")
                        if v:
                            p = float(str(v).replace(",", ""))
                            if 300 <= p <= 100000:
                                price = int(p)
                                break
                    if price:
                        break
                if price:
                    break
            except Exception:
                continue
    except Exception:
        pass

    if price is None:
        if retailer == "Flipkart":
            sels = ["div.Nx9bqj.CxhGGd", "div.Nx9bqj", "div._30jeq3._1_WHN1", "div._30jeq3"]
        else:
            sels = ["span.pdp-price strong", "span.pdp-price"]
        for sel in sels:
            try:
                loc = page.locator(sel).first
                if loc.count():
                    p = parse_money(loc.inner_text(timeout=1500))
                    if p and 300 <= p <= 100000:
                        price = p
                        break
            except Exception:
                continue

    image = ""
    for sel in ['meta[property="og:image"]', 'img[class*="DByuf4"]', 'img[class*="pdp-image"]']:
        try:
            loc = page.locator(sel).first
            if loc.count():
                image = (loc.get_attribute("content") if sel.startswith("meta") else loc.get_attribute("src")) or ""
                if image and image.startswith("http"):
                    break
        except Exception:
            continue

    return {
        "retailer": retailer,
        "title": title,
        "price": price,
        "url": url,
        "image": image,
        "gender": extract_gender_from_text(title),
        "colors": sorted(extract_colors_from_text(title)),
    }

def find_candidates_for_retailer(page, retailer, amazon_product):
    queries = candidate_queries(amazon_product)
    all_candidates = []
    for q in queries:
        all_candidates.extend(search_via_duckduckgo(page, retailer, q))
        if len(all_candidates) >= 12:
            break

    unique = {}
    for c in all_candidates:
        key = c["url"].split("?")[0]
        if key not in unique:
            unique[key] = c

    limit = min(len(unique), MAX_CANDIDATES_PER_RETAILER)
    scraped = []
    for c in list(unique.values())[:limit]:
        result = scrape_product_page(page, retailer, c["url"], c["title"])
        if not result or not result.get("price"):
            continue
        result["similarity"] = similarity_score(
            amazon_product["name"],
            amazon_product["brand"],
            result["title"],
            amazon_product.get("slug", ""),
        )
        scraped.append(result)

    scraped.sort(key=lambda x: x["similarity"], reverse=True)
    return scraped


# ============================================================
# LINKS FILE
# ============================================================

def read_links():
    if not LINKS_FILE.exists():
        print(f"ERROR: {LINKS_FILE} not found.")
        print(f"Create it and paste one Amazon affiliate URL per line.")
        sys.exit(1)
    raw = LINKS_FILE.read_text(encoding="utf-8").splitlines()
    links = []
    for line in raw:
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        if "amazon." in line.lower():
            links.append(line)
    return links


# ============================================================
# MAIN
# ============================================================

def process_one(context, url):
    try:
        amazon = extract_amazon(context.new_page(), url)
        fk = find_candidates_for_retailer(context.new_page(), "Flipkart", amazon)
        my = find_candidates_for_retailer(context.new_page(), "Myntra", amazon)
        return {"amazon": amazon, "flipkart": fk, "myntra": my}
    except Exception as e:
        print(f"  x Failed: {e}")
        return None

def main():
    links = read_links()
    if not links:
        print("No valid Amazon links found in links.txt")
        sys.exit(1)

    print(f"\n=== Processing {len(links)} product(s) ===")

    with sync_playwright() as p:
        # FIXED: Removed channel="msedge" so it uses Playwright's built-in Chromium
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context(
            viewport={"width": 1366, "height": 900},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/140.0.0.0 Safari/537.36"
            ),
        )

        queue = []
        try:
            for i, url in enumerate(links, 1):
                print(f"\n--- [{i}/{len(links)}] ---")
                bundle = process_one(context, url)
                if bundle:
                    queue.append(bundle)
                    # Save after EACH product — survives Ctrl+C
                    QUEUE_FILE.write_text(
                        json.dumps(queue, indent=2, ensure_ascii=False),
                        encoding="utf-8",
                    )
                    print(f"  ✓ Saved {len(queue)} products to queue")
                else:
                    print(f"  x Skipped (failed to process)")

                # Delay between products (except after last)
                if i < len(links):
                    print(f"  Waiting {DELAY_BETWEEN_PRODUCTS}s before next...")
                    time.sleep(DELAY_BETWEEN_PRODUCTS)

            print(f"\n=== DONE ===")
            print(f"Scraped {len(queue)}/{len(links)} products -> {QUEUE_FILE}")
            print(f"Open http://localhost:8000 to review.")

        except KeyboardInterrupt:
            print(f"\n\nInterrupted. {len(queue)} products saved to queue.")
            print(f"Open http://localhost:8000 to review what's saved.")
        except Exception as e:
            print(f"\nFAILED: {e}\n")
            print(f"{len(queue)} products saved before failure.")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    main()
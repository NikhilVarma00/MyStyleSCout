import json
import re
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PRODUCTS_FILE = BASE_DIR / "products.json"
DESCRIPTIONS_FILE = BASE_DIR / "products" / "descriptions.json"
TEMPLATE_FILE = BASE_DIR / "templates" / "product.html"
OUTPUT_DIR = BASE_DIR / "products"
SITEMAP_FILE = BASE_DIR / "sitemap.xml"
SITE_URL = "https://www.mystylescout.in"

OUTPUT_DIR.mkdir(exist_ok=True)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def load_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def build_schema(product, url, description_text):
    offers = []
    for store in product["stores"]:
        offers.append({
            "@type": "Offer",
            "url": store["url"],
            "price": store["price"],
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "Organization", "name": store["name"]},
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": "0",
                    "currency": "INR"
                },
                "shippingDestination": {
                    "@type": "DefinedRegion",
                    "addressCountry": "IN"
                },
                "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" },
                    "transitTime": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY" }
                }
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "IN",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 7,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
            }
        })
    
    safe_name = product.get("name", "")[:150]
    safe_sku = product.get("id", "")[:50]
    
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": safe_name,
        "sku": safe_sku,
        "description": description_text,
        "brand": {"@type": "Brand", "name": product.get("brand", "")},
        "image": product.get("gallery") or [product.get("image", "")],
        "offers": offers
    }
    return json.dumps(schema, indent=2, ensure_ascii=False)


def build_stores_html(product):
    seen = set()
    unique_stores = []
    for store in product.get("stores", []):
        if store.get("name") not in seen:
            unique_stores.append(store)
            seen.add(store["name"])

    if not unique_stores:
        return ""

    preferred_order = ["Amazon", "Flipkart", "Myntra"]
    unique_stores.sort(
        key=lambda s: preferred_order.index(s["name"]) if s["name"] in preferred_order else 999
    )

    lowest = min(s["price"] for s in unique_stores)
    html = ""
    for store in unique_stores:
        badge = '<span class="best-badge">BEST</span>' if store["price"] == lowest else ""
        html += f'''
        <a class="store-card" href="{store["url"]}" target="_blank" rel="sponsored nofollow noopener" style="text-decoration:none;color:inherit;">
          <span class="store-name">{store["name"]}{badge}</span>
          <span class="store-right">
            <span class="store-price">₹{store["price"]:,}</span>
            <span class="buy-now-btn">Buy Now →</span>
          </span>
        </a>'''
    return html


def build_thumbs_html(product):
    gallery = product.get("gallery") or [product.get("image", "")]
    html = ""
    for i, img in enumerate(gallery):
        active = "active" if i == 0 else ""
        html += f'<img src="{img}" class="{active}" alt="">'
    return html


def build_price_history_html(product):
    history = product.get("priceHistory", [])
    if not history or len(history) < 2:
        return ""

    recent = list(reversed(history))[:6]
    items = " → ".join(f"₹{p:,}" for p in recent)
    lowest = min(history)
    highest = max(history)
    drop = highest - lowest

    return f'''
    <section class="pdp-price-history">
      <h2>Price History</h2>
      <p class="pdp-price-track">
        <span class="pdp-price-label">Tracked prices:</span>
        <span class="pdp-price-values">{items}</span>
      </p>
      <p class="pdp-price-summary">
        Lowest: <strong>₹{lowest:,}</strong> · 
        Highest: <strong>₹{highest:,}</strong> · 
        Total drop: <strong>₹{drop:,}</strong>
      </p>
    </section>
    '''


def build_specs_html(product):
    if "specs" in product and product["specs"]:
        spec_order = [
            "material", "closure_type", "country_of_origin", "weight", 
            "rating", "heel_type", "water_resistance_level", "style", 
            "outer_material", "style_name", "model_name", "brand_color", 
            "activity", "manufacturer"
        ]
        specs_items = []
        for key in spec_order:
            if key in product["specs"] and product["specs"][key]:
                label = key.replace("_", " ").title()
                value = product["specs"][key]
                specs_items.append(f'<div class="label">{label}</div><div class="value">{value}</div>')
        
        if specs_items:
            return f'''
            <div class="pdp-details-container" style="margin-top: 24px;">
                <h3>Top highlights</h3>
                <div class="details-grid">
                    {"".join(specs_items)}
                </div>
            </div>'''
    return ""


def build_about_html(product, fallback_text):
    if "about" in product and product["about"]:
        about_items = "".join([f"<li>{item}</li>" for item in product["about"]])
        
        show_button = len(product["about"]) > 3
        button_html = '<button class="pdp-view-more-btn" id="aboutToggle" type="button">View More ↓</button>' if show_button else ''
        collapse_class = 'collapsed' if show_button else ''
        
        return f'''
        <div class="pdp-details-container">
            <h3>About this item</h3>
            <div class="about-content {collapse_class}" id="aboutContent">
                <ul class="about-list">
                    {about_items}
                </ul>
            </div>
            {button_html}
        </div>'''
    else:
        return f'''
        <div class="pdp-about">
            <h3>About this sneaker</h3>
            <p>{fallback_text}</p>
        </div>'''


def build_related_html(product, all_products):
    try:
        brand = str(product.get("brand", "")).lower()
        price = int(product.get("price", 0))
    except (ValueError, TypeError):
        brand = ""
        price = 0

    same_brand = []
    for p in all_products:
        if not isinstance(p, dict):
            continue
        try:
            p_price = int(p.get("price", 0))
            p_brand = str(p.get("brand", "")).lower()
        except (ValueError, TypeError):
            continue
        
        if p.get("id") != product.get("id") and p.get("category") == "sneakers" and p_brand == brand:
            same_brand.append(p)
    same_brand = same_brand[:4]

    price_low = price * 0.6
    price_high = price * 1.4

    similar_price = []
    for p in all_products:
        if not isinstance(p, dict):
            continue
        try:
            p_price = int(p.get("price", 0))
            p_brand = str(p.get("brand", "")).lower()
        except (ValueError, TypeError):
            continue
        
        if (p.get("id") != product.get("id") and 
            p.get("category") == "sneakers" and 
            p_brand != brand and 
            price_low <= p_price <= price_high):
            similar_price.append(p)
    
    similar_price.sort(key=lambda p: abs(int(p.get("price", 0)) - price))
    similar_price = similar_price[:4]

    def render_cards(products_list):
        if not products_list:
            return ""
        cards = ""
        for p in products_list:
            cards += f'''
            <a href="{p["id"]}.html" class="pdp-related-card">
              <div class="pdp-related-image">
                <img src="{p.get("image", "")}" alt="{p.get("name", "")}" loading="lazy">
              </div>
              <div class="pdp-related-brand">{p.get("brand", "")}</div>
              <div class="pdp-related-name">{p.get("name", "")}</div>
              <div class="pdp-related-price">₹{int(p.get("price", 0)):,}</div>
            </a>'''
        return f'<div class="pdp-related-grid">{cards}</div>'

    sections = ""

    if same_brand:
        sections += f'''
        <section class="pdp-related">
          <h2>More from {product.get("brand", "")}</h2>
          {render_cards(same_brand)}
        </section>'''

    if similar_price:
        sections += f'''
        <section class="pdp-related">
          <h2>You might also like</h2>
          {render_cards(similar_price)}
        </section>'''

    return sections


def render_product(product, descriptions, all_products):
    pid = product["id"]
    slug = slugify(pid)
    url = f"{SITE_URL}/products/{slug}.html"

    display_name = product.get("fullName") or product["name"]
    title = f'{display_name} Price in India | Amazon vs Flipkart vs Myntra'
    h1 = display_name
    desc = (f'Compare {display_name} price across Amazon, Flipkart, and Myntra. '
            f'Lowest price ₹{product["price"]:,} on StyleScout.')

    custom = descriptions.get(pid, {})

    brand_name = product.get("brand", "brand")
    product_name = product.get("name", "sneaker")
    current_price = product.get("price", 0)
    old_price = product.get("oldPrice", 0)
    discount = product.get("discount", 0)

    long_desc = custom.get("description") or (
        f'The {product_name} by {brand_name} is a popular choice for sneaker enthusiasts in India. '
        f'Right now, the lowest tracked price for this shoe is ₹{current_price:,}, down from its original MRP of ₹{old_price:,} '
        f'— that is a genuine discount of {discount}%. We track prices daily across Amazon, Flipkart, and Myntra '
        f'to find the best deals. Compare live prices using the store links above before you make a purchase.'
    )

    schema_desc = custom.get("description") or f"Compare live prices for {product_name} across Amazon, Flipkart, and Myntra in India."

    specs_html = build_specs_html(product)
    about_html = build_about_html(product, long_desc)

    html = TEMPLATE_FILE.read_text(encoding="utf-8")
    replacements = {
        "{{TITLE}}": title,
        "{{THUMBS}}": build_thumbs_html(product),
        "{{DESCRIPTION}}": desc,
        "{{CANONICAL}}": url,
        "{{IMAGE}}": product["image"],
        "{{SCHEMA}}": build_schema(product, url, schema_desc),
        "{{H1}}": h1,
        "{{BRAND}}": product["brand"],
        "{{NAME}}": display_name,
        "{{PRICE}}": f'{product["price"]:,}',
        "{{OLDPRICE}}": f'{product["oldPrice"]:,}',
        "{{DISCOUNT}}": str(product["discount"]),
        "{{STORES}}": build_stores_html(product),
        "{{SPECS}}": specs_html,
        "{{ABOUT}}": about_html,
        "{{RELATED}}": build_related_html(product, all_products),
        "{{PRICE_HISTORY}}": build_price_history_html(product),
        "{{STORES_COUNT}}": f'{len(set(s["name"] for s in product["stores"]))} stores',
    }
    for key, val in replacements.items():
        html = html.replace(key, val)

    (OUTPUT_DIR / f"{slug}.html").write_text(html, encoding="utf-8")
    return slug


def build_sitemap(slugs):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += f'  <url>\n    <loc>{SITE_URL}/</loc>\n'
    xml += f'    <lastmod>{today}</lastmod>\n'
    xml += '    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n'

    static_pages = [
        ("blog.html", "weekly", "0.9"),
        ("sneakers.html", "weekly", "0.8"),
        ("privacy.html", "monthly", "0.3"),
        ("terms.html", "monthly", "0.3"),
    ]
    for path, freq, prio in static_pages:
        xml += f'  <url>\n    <loc>{SITE_URL}/{path}</loc>\n'
        xml += f'    <lastmod>{today}</lastmod>\n'
        xml += f'    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>\n'

    # ==========================================
    # DYNAMIC BLOG SITEMAP GENERATION
    # ==========================================
    blog_dir = BASE_DIR / "blog"
    if blog_dir.exists():
        for filepath in blog_dir.glob("*.html"):
            post_path = f"blog/{filepath.name}"
            xml += f'  <url>\n    <loc>{SITE_URL}/{post_path}</loc>\n'
            xml += f'    <lastmod>{today}</lastmod>\n'
            xml += '    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n'

    for slug in slugs:
        xml += f'  <url>\n    <loc>{SITE_URL}/products/{slug}.html</loc>\n'
        xml += f'    <lastmod>{today}</lastmod>\n'
        xml += '    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n'

    xml += '</urlset>\n'
    SITEMAP_FILE.write_text(xml, encoding="utf-8")


def main():
    products = load_json(PRODUCTS_FILE, [])
    if not products:
        print("No products found in products.json")
        return

    valid_products = []
    for idx, p in enumerate(products):
        if not isinstance(p, dict):
            print(f"  ⚠ Warning: Skipping item at index {idx} because it's not a dictionary: {type(p)}")
            continue
        if "id" not in p or "price" not in p:
            print(f"  ⚠ Warning: Skipping item at index {idx} because it's missing 'id' or 'price'")
            continue
        valid_products.append(p)
    
    products = valid_products

    descriptions = load_json(DESCRIPTIONS_FILE, {})

    for f in OUTPUT_DIR.glob("*.html"):
        f.unlink()

    print(f"Found {len(products)} valid products. Generating pages...")
    slugs = []
    for p in products:
        if p.get("category") != "sneakers":
            continue
        slug = render_product(p, descriptions, products)
        slugs.append(slug)
        print(f"  ✓ {slug}.html")

    build_sitemap(slugs)
    print(f"\nDone. {len(slugs)} pages + sitemap.xml regenerated.")


if __name__ == "__main__":
    main()
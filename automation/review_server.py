"""
StyleScout Review Server
Run:   python review_server.py
Open:  http://localhost:8000
"""

import json
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

SITE_ROOT = BASE_DIR.parent
PRODUCTS_FILE = SITE_ROOT / "products.json"
CANDIDATES_FILE = OUTPUT_DIR / "candidates.json"
QUEUE_FILE = OUTPUT_DIR / "candidates_queue.json"

_playwright = None
_browser = None


def get_browser():
    global _playwright, _browser
    if _browser is None:
        _playwright = sync_playwright().start()
        _browser = _playwright.chromium.launch(headless=True, channel="msedge")
    return _browser


def parse_money(text):
    if not text:
        return None
    text = text.replace(",", "")
    for match in re.findall(r"(?:₹|Rs\.?\s*)?(\d{2,7}(?:\.\d{1,2})?)", text):
        try:
            v = float(match)
            if 300 <= v <= 100000:
                return int(round(v))
        except ValueError:
            pass
    return None


def rescrape_url(url):
    browser = get_browser()
    context = browser.new_context(
        viewport={"width": 1366, "height": 900},
        locale="en-IN",
        timezone_id="Asia/Kolkata",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
        extra_http_headers={
            "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Sec-Ch-Ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        },
    )
    page = context.new_page()
    try:
        page.goto(url, wait_until="commit", timeout=60000)
        page.wait_for_timeout(7000)
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
            sels = [
                "div.Nx9bqj.CxhGGd", "div.Nx9bqj", "div._30jeq3",
                "span.pdp-price strong", "span.pdp-price",
                'meta[property="product:price:amount"]',
            ]
            for sel in sels:
                try:
                    loc = page.locator(sel).first
                    if loc.count():
                        val = (loc.get_attribute("content") if sel.startswith("meta") else loc.inner_text(timeout=1500)) or ""
                        p = parse_money(val)
                        if p:
                            price = p
                            break
                except Exception:
                    continue

        image = ""
        for sel in ['meta[property="og:image"]', 'img[class*="DByuf4"]', 'img[class*="image-grid-image"]', 'img[class*="pdp-image"]']:
            try:
                loc = page.locator(sel).first
                if loc.count():
                    image = (loc.get_attribute("content") if sel.startswith("meta") else loc.get_attribute("src")) or ""
                    if image and image.startswith("http"):
                        break
            except Exception:
                continue

        return {"title": title, "price": price, "image": image, "url": url}
    except Exception as e:
        return {"error": str(e)}
    finally:
        context.close()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, code, body, content_type="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/review.html", "/index.html"):
            html = (BASE_DIR / "review.html").read_text(encoding="utf-8")
            self._send(200, html, "text/html; charset=utf-8")
            return

        if path == "/candidates.json":
            # Queue takes priority
            if QUEUE_FILE.exists():
                try:
                    queue = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
                except Exception:
                    queue = []
                if queue:
                    self._send(200, json.dumps({
                        "mode": "batch",
                        "current": queue[0],
                        "remaining": len(queue) - 1,
                        "total": len(queue),
                    }))
                    return
            # Fallback to single
            if not CANDIDATES_FILE.exists():
                self._send(404, json.dumps({"error": "no candidates"}))
                return
            self._send(200, json.dumps({
                "mode": "single",
                "current": json.loads(CANDIDATES_FILE.read_text(encoding="utf-8")),
                "remaining": 0,
                "total": 1,
            }))
            return

        if path == "/products.json":
            if not PRODUCTS_FILE.exists():
                self._send(200, "[]")
                return
            self._send(200, PRODUCTS_FILE.read_bytes())
            return

        if path == "/rescrape":
            qs = parse_qs(parsed.query)
            url = unquote(qs.get("url", [""])[0])
            if not url.startswith("http"):
                self._send(400, json.dumps({"error": "invalid url"}))
                return
            self._send(200, json.dumps(rescrape_url(url)))
            return

        self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/save":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            try:
                incoming = json.loads(body)
            except Exception as e:
                self._send(400, json.dumps({"error": f"bad json: {e}"}))
                return

            existing = []
            if PRODUCTS_FILE.exists():
                try:
                    existing = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
                    if not isinstance(existing, list):
                        existing = []
                except Exception:
                    existing = []

            by_id = {p.get("id"): p for p in existing if isinstance(p, dict) and p.get("id")}
            for p in incoming:
                if isinstance(p, dict) and p.get("id"):
                    by_id[p["id"]] = p
            merged = list(by_id.values())

            PRODUCTS_FILE.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
            self._send(200, json.dumps({
                "ok": True,
                "total": len(merged),
                "written_to": str(PRODUCTS_FILE),
            }))
            return

        if parsed.path == "/next-product":
            if QUEUE_FILE.exists():
                try:
                    queue = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
                    if queue:
                        queue.pop(0)
                        QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False), encoding="utf-8")
                    self._send(200, json.dumps({"ok": True, "remaining": len(queue)}))
                except Exception as e:
                    self._send(500, json.dumps({"error": str(e)}))
            else:
                self._send(200, json.dumps({"ok": True, "remaining": 0}))
            return

        if parsed.path == "/clear-candidates":
            if QUEUE_FILE.exists():
                QUEUE_FILE.unlink()
            if CANDIDATES_FILE.exists():
                CANDIDATES_FILE.unlink()
            self._send(200, json.dumps({"ok": True}))
            return

        self._send(404, json.dumps({"error": "not found"}))


def main():
    port = 8000
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"\n StyleScout Review Server running")
    print(f"  Open:  http://localhost:{port}")
    print(f"  Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()


if __name__ == "__main__":
    main()
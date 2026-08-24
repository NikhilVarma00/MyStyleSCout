(() => {
  const getTxt = (selectors) => {
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return "";
  };

  // Many product pages embed structured Product data for SEO (schema.org JSON-LD).
  // This is far more reliable than CSS class selectors, which sites like Flipkart
  // change often. We try this first on every site, then fall back to selectors.
  const getJsonLdProduct = () => {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        let data;
        try { data = JSON.parse(script.textContent); } catch (e) { continue; }
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const type = item && item["@type"];
          const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
          if (isProduct) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            return {
              name: item.name || "",
              brand: (item.brand && (item.brand.name || item.brand)) || "",
              price: offer ? (offer.price || offer.lowPrice || "") : ""
            };
          }
        }
      }
    } catch (e) {}
    return null;
  };

  const host = window.location.hostname.toLowerCase();
  let site = "", name = "", brand = "", rawPrice = "", candidateImgs = [];

  const isValidImg = (src) => {
    if (!src || typeof src !== "string") return false;
    const s = src.toLowerCase();
    if (s.includes("studio-logo") || s.includes("sprite") || s.includes("logo") || s.includes("icon") || s.includes("rating") || s.startsWith("data:") || s.includes("gstatic")) return false;
    return (s.includes("amazon") || s.includes("m.media-amazon") || s.includes("flixcart") || s.includes("rukminim") || s.includes("myntassets") || s.includes("http"));
  };

  // Upgrade an Amazon image URL to a large size, whatever size code it currently has.
  // Amazon size codes look like ._SS40_, ._SY695_, ._AC_UL320_, ._SR38,50_, etc.
  const upgradeAmazonUrl = (src) => {
    return src.replace(/\._[A-Za-z0-9,_]+_\.(jpg|jpeg|png|webp)/i, "._SL1500_.$1");
  };

  // Grabs EVERY unique, valid HD image found for the given selectors. No cap —
  // if a product has 10 photos on Amazon, all 10 come through.
  const extractAllHDImages = (selectors, upgrade) => {
    let imgs = [];
    document.querySelectorAll(selectors).forEach(img => {
      let src = img.src || img.getAttribute("data-src") || "";
      if (src && upgrade) src = upgrade(src);
      imgs.push(src);
    });
    return Array.from(new Set(imgs.filter(isValidImg)));
  };

  // Amazon's thumbnail strip often lazy-loads real <img src> only on hover,
  // so plain src reading misses later thumbnails. Each thumbnail also carries
  // a data-a-dynamic-image attribute with that photo's full-res URL baked
  // into the HTML from page load, so this reads that directly as a backup.
  const extractAmazonDynamicImages = () => {
    let imgs = [];
    document.querySelectorAll("#altImages img, #landingImage, #imgBlkFront").forEach(img => {
      const raw = img.getAttribute("data-a-dynamic-image");
      if (!raw) return;
      try {
        const map = JSON.parse(raw);
        const urls = Object.keys(map);
        if (urls.length) imgs.push(urls[urls.length - 1]); // largest resolution listed
      } catch (e) {}
    });
    return imgs.filter(isValidImg);
  };

  const jsonLd = getJsonLdProduct();

  if (host.includes("amazon")) {
    site = "Amazon";
    name = (jsonLd && jsonLd.name) || getTxt(["#productTitle", "h1#title", "h1"]);
    brand = (jsonLd && jsonLd.brand) || getTxt(["#bylineInfo", "a#bylineInfo"]).replace(/^(Brand:\s*|Visit the\s*)/i, "").replace(/\s+Store$/i, "").trim();
    rawPrice = (jsonLd && jsonLd.price) ? String(jsonLd.price) : getTxt([".a-price-whole", "#priceblock_ourprice", "#priceblock_dealprice"]);
    // Amazon is the ONLY photo source: grab every HD image available, uncapped,
    // combining plain <img src> reads with the more reliable dynamic-image data.
    const srcImgs = extractAllHDImages("#landingImage, #imgBlkFront, #altImages img", upgradeAmazonUrl);
    const dynamicImgs = extractAmazonDynamicImages();
    candidateImgs = Array.from(new Set([...srcImgs, ...dynamicImgs]));
  } else if (host.includes("flipkart")) {
    site = "Flipkart";
    name = (jsonLd && jsonLd.name) || getTxt([".B_NuCI", "h1._6ERy25", ".VU-ZEz", "span.VU-ZEz", "h1"]);
    brand = (jsonLd && jsonLd.brand) || getTxt([".G63y2t", ".mI9P2C"]) || (name ? name.split(" ")[0] : "");
    rawPrice = (jsonLd && jsonLd.price) ? String(jsonLd.price) : getTxt([".Nx9bqj", "._30jeq3", "._16J3L3", ".hl05eU ._30jeq3", "[class*='price']"]);
    // Flipkart: name/brand/price only. No photos — Amazon is the sole photo source.
  } else if (host.includes("myntra")) {
    site = "Myntra";
    name = (jsonLd && jsonLd.name) || getTxt(['[data-testid="product-title"]', ".pdp-name", ".pdp-title"]);
    brand = (jsonLd && jsonLd.brand) || getTxt([".pdp-title"]) || (name ? name.split(" ")[0] : "");
    rawPrice = (jsonLd && jsonLd.price) ? String(jsonLd.price) : getTxt(['[data-testid="price"]', ".pdp-price", ".pdp-mrp"]);
    // Myntra: name/brand/price only. No photos — Amazon is the sole photo source.
  } else {
    alert("StyleScout: Open an Amazon, Flipkart, or Myntra product page.");
    return;
  }

  const front = candidateImgs[0] || "";

  const priceDigits = rawPrice ? rawPrice.replace(/[^\d]/g, "") : "";
  const price = priceDigits ? parseInt(priceDigits, 10) : 0;

  const product = {
    name: name || "Unknown Product",
    brand: brand || "Unknown Brand",
    price: price,
    url: window.location.href,
    site: site,
    image: front,
    gallery: candidateImgs
  };

  const payload = encodeURIComponent(JSON.stringify(product));
  const a = document.createElement('a');
  a.href = "https://www.mystylescout.in/Tools/importer.html#data=" + payload;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
})();

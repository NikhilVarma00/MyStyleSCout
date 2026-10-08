(() => {
  const getTxt = (selectors) => {
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return "";
  };

  // Robust JSON-LD Product extractor. Handles @graph wrappers, AggregateOffer, etc.
  const getJsonLdProduct = () => {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        let data;
        try { data = JSON.parse(script.textContent); } catch (e) { continue; }

        const flat = [];
        const walk = (node) => {
          if (!node) return;
          if (Array.isArray(node)) { node.forEach(walk); return; }
          if (typeof node !== "object") return;
          if (node["@graph"]) walk(node["@graph"]);
          flat.push(node);
        };
        walk(data);

        for (const item of flat) {
          const type = item["@type"];
          const types = Array.isArray(type) ? type : [type];
          if (!types.includes("Product")) continue;

          let offer = item.offers;
          if (Array.isArray(offer)) offer = offer[0];

          let price = "";
          if (offer) {
            price = offer.price || offer.lowPrice || "";
            if (!price && offer.priceSpecification) {
              const ps = Array.isArray(offer.priceSpecification)
                ? offer.priceSpecification[0]
                : offer.priceSpecification;
              price = ps.price || ps.minPrice || "";
            }
          }

          return {
            name: item.name || "",
            brand: (item.brand && (item.brand.name || item.brand)) || "",
            price: price
          };
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

  const upgradeAmazonUrl = (src) => {
    return src.replace(/\._[A-Za-z0-9,_]+_\.(jpg|jpeg|png|webp)/i, "._SL1500_.$1");
  };

  const extractAllHDImages = (selectors, upgrade) => {
    let imgs = [];
    document.querySelectorAll(selectors).forEach(img => {
      let src = img.src || img.getAttribute("data-src") || "";
      if (src && upgrade) src = upgrade(src);
      imgs.push(src);
    });
    return Array.from(new Set(imgs.filter(isValidImg)));
  };

  const extractAmazonDynamicImages = () => {
    let imgs = [];
    document.querySelectorAll("#altImages img, #landingImage, #imgBlkFront").forEach(img => {
      const raw = img.getAttribute("data-a-dynamic-image");
      if (!raw) return;
      try {
        const map = JSON.parse(raw);
        const urls = Object.keys(map);
        if (urls.length) imgs.push(urls[urls.length - 1]);
      } catch (e) {}
    });
    return imgs.filter(isValidImg);
  };

  // SMART FLIPKART PRICE EXTRACTOR
  const extractFlipkartPrice = () => {
    // 1. Try known reliable class names for the selling price
    const sellingPriceSelectors = [
      "div.Nx9bqj", "div._30jeq3", "div._16J3L3", "div.hl05eU div._30jeq3"
    ];
    for (const s of sellingPriceSelectors) {
      const el = document.querySelector(s);
      if (el) {
        const t = (el.textContent || "").trim();
        if (/\d/.test(t)) return t;
      }
    }

    // 2. Fallback: scan all elements for text that looks like a price and pick the most prominent one
    const allElements = document.querySelectorAll("div, span, p");
    const prices = [];
    for (const el of allElements) {
      if (el.children.length > 2) continue; // Skip large containers
      const t = (el.textContent || "").trim();
      // Matches ₹1,299 or ₹ 1,299
      if (/^₹\s?[\d,]+$/.test(t)) {
        const digits = t.replace(/[^\d]/g, "");
        if (digits.length >= 3 && digits.length <= 6) { // Reasonable price range
          const style = window.getComputedStyle(el);
          prices.push({
            el: el,
            price: parseInt(digits, 10),
            text: t,
            fontSize: parseFloat(style.fontSize) || 0,
            fontWeight: parseInt(style.fontWeight, 10) || 0
          });
        }
      }
    }
    if (prices.length > 0) {
      // Sort by fontSize descending, then fontWeight descending, then price ascending
      prices.sort((a, b) => {
        if (b.fontSize !== a.fontSize) return b.fontSize - a.fontSize;
        if (b.fontWeight !== a.fontWeight) return b.fontWeight - a.fontWeight;
        return a.price - b.price;
      });
      return prices[0].text;
    }
    return "";
  };

  const jsonLd = getJsonLdProduct();

  if (host.includes("amazon")) {
    site = "Amazon";
    name = (jsonLd && jsonLd.name) || getTxt(["#productTitle", "h1#title", "h1"]);
    brand = (jsonLd && jsonLd.brand) || getTxt(["#bylineInfo", "a#bylineInfo"]).replace(/^(Brand:\s*|Visit the\s*)/i, "").replace(/\s+Store$/i, "").trim();
    rawPrice = (jsonLd && jsonLd.price) ? String(jsonLd.price) : getTxt([".a-price-whole", "#priceblock_ourprice", "#priceblock_dealprice"]);
    const srcImgs = extractAllHDImages("#landingImage, #imgBlkFront, #altImages img", upgradeAmazonUrl);
    const dynamicImgs = extractAmazonDynamicImages();
    candidateImgs = Array.from(new Set([...srcImgs, ...dynamicImgs]));
  } else if (host.includes("flipkart")) {
    site = "Flipkart";
    name = (jsonLd && jsonLd.name) || getTxt([".B_NuCI", "h1._6ERy25", ".VU-ZEz", "span.VU-ZEz", "h1"]);
    brand = (jsonLd && jsonLd.brand) || getTxt([".G63y2t", ".mI9P2C"]) || (name ? name.split(" ")[0] : "");
    rawPrice = (jsonLd && jsonLd.price) ? String(jsonLd.price) : extractFlipkartPrice();
  } else if (host.includes("myntra")) {
    site = "Myntra";
    name = (jsonLd && jsonLd.name) || getTxt(['[data-testid="product-title"]', ".pdp-name", ".pdp-title"]);
    brand = (jsonLd && jsonLd.brand) || getTxt([".pdp-title"]) || (name ? name.split(" ")[0] : "");
    rawPrice = (jsonLd && jsonLd.price) ? String(jsonLd.price) : getTxt(['[data-testid="price"]', ".pdp-price", ".pdp-mrp"]);
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
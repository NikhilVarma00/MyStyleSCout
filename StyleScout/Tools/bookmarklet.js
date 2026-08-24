(() => {
  const getTxt = (selectors) => {
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return "";
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
  // Instead of matching a fixed list, this matches ANY ._..._. segment and swaps it.
  const upgradeAmazonUrl = (src) => {
    return src.replace(/\._[A-Za-z0-9,_]+_\.(jpg|jpeg|png|webp)/i, "._SL1500_.$1");
  };

  // Flipkart/rukminim URLs encode width/height directly in the path: /image/300/300/...
  const upgradeFlipkartUrl = (src) => {
    return src.replace(/\/image\/\d+\/\d+\//, "/image/1280/1280/");
  };

  // Myntra images sometimes carry a small-size query string; strip it for the original file.
  const upgradeMyntraUrl = (src) => {
    return src.split("?")[0];
  };

  const extractHDImages = (selectors, upgrade) => {
    let imgs = [];
    document.querySelectorAll(selectors).forEach(img => {
      let src = img.src || img.getAttribute("data-src") || "";
      if (src && upgrade) src = upgrade(src);
      imgs.push(src);
    });
    return imgs.filter(isValidImg);
  };

  if (host.includes("amazon")) {
    site = "Amazon";
    name = getTxt(["#productTitle", "h1#title", "h1"]);
    brand = getTxt(["#bylineInfo", "a#bylineInfo"]).replace(/^(Brand:\s*|Visit the\s*)/i, "").replace(/\s+Store$/i, "").trim();
    rawPrice = getTxt([".a-price-whole", "#priceblock_ourprice", "#priceblock_dealprice"]);
    candidateImgs.push(...extractHDImages("#landingImage, #imgBlkFront, #altImages img", upgradeAmazonUrl));
  } else if (host.includes("flipkart")) {
    site = "Flipkart";
    name = getTxt([".B_NuCI", "h1._6ERy25"]);
    brand = getTxt([".G63y2t", ".mI9P2C"]) || (name ? name.split(" ")[0] : "");
    rawPrice = getTxt([".Nx9bqj", "._30jeq3", "._16J3L3"]);
    candidateImgs.push(...extractHDImages("img[src*='flixcart.com/image/'], img[src*='rukminim']", upgradeFlipkartUrl));
  } else if (host.includes("myntra")) {
    site = "Myntra";
    name = getTxt(['[data-testid="product-title"]', ".pdp-name"]);
    brand = getTxt([".pdp-title"]) || (name ? name.split(" ")[0] : "");
    rawPrice = getTxt(['[data-testid="price"]', ".pdp-price", ".pdp-mrp"]);
    candidateImgs.push(...extractHDImages(".image-grid-image, img[src*='myntassets.com']", upgradeMyntraUrl));
  } else {
    alert("StyleScout: Open an Amazon, Flipkart, or Myntra product page.");
    return;
  }

  const uniqueImgs = Array.from(new Set(candidateImgs));
  const front = uniqueImgs[0] || "";
  const side = uniqueImgs[1] || front;
  const back = uniqueImgs[2] || side || front;

  const priceDigits = rawPrice ? rawPrice.replace(/[^\d]/g, "") : "";
  const price = priceDigits ? parseInt(priceDigits, 10) : 0;

  const product = {
    name: name || "Unknown Product",
    brand: brand || "Unknown Brand",
    price: price,
    url: window.location.href,
    site: site,
    image: front,
    gallery: [front, side, back]
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
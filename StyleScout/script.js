const products = [
  {
    id: "sparx", name: "Sparx SM 439 White Sneakers", brand: "Sparx", price: 636, category: "sneakers", oldPrice: 849, discount: 16,
    image: "https://m.media-amazon.com/images/I/61UoRfL+urL._SY695_.jpg",
    gallery: ["https://rukminim2.flixcart.com/image/1536/1536/xif0q/shoe/x/i/g/-original-imahqyhbermvhjzv.jpeg", "https://rukminim2.flixcart.com/image/480/640/xif0q/shoe/k/v/s/-original-imahqyhbtzpkf2dy.jpeg", "https://rukminim2.flixcart.com/image/480/640/xif0q/shoe/o/z/t/-original-imahqyhbzzytnfvg.jpeg"],
    stores: [
      { name: "Flipkart", price: 715, url: "https://www.flipkart.com/sparx-men-sm-439-white-sneakers/p/itm2fb11e75ce1bf" },
      { name: "Amazon", price: 636, url: "https://www.amazon.in/dp/B07Y548LQW?tag=stylescoutin2-21" },
      { name: "Myntra", price: 849, url: "https://www.myntra.com/casual-shoes/sparx/sparx-men-dip-textured-comfort-insole-lace-up-shoes/12567852/buy" }
    ]
  },
  {
    id: "nike", name: "Nike Run Defy", brand: "Nike", price: 3995, category: "sneakers", oldPrice: 3955, discount: 0,
    image: "https://adn-static1.nykaa.com/nykdesignstudio-images/pub/media/catalog/product/a/d/ad22b92Nike-HM9594-002_1.jpg?rnd=20200526195200&tr=w-1080",
    gallery: ["https://adn-static1.nykaa.com/nykdesignstudio-images/pub/media/catalog/product/a/d/ad22b92Nike-HM9594-002_4.jpg?rnd=20200526195200&tr=w-1080", "https://adn-static1.nykaa.com/nykdesignstudio-images/pub/media/catalog/product/a/d/ad22b92Nike-HM9594-002_7.jpg?rnd=20200526195200&tr=w-1080", "https://adn-static1.nykaa.com/nykdesignstudio-images/pub/media/catalog/product/a/d/ad22b92Nike-HM9594-002_6.jpg?rnd=20200526195200&tr=w-1080"],
    stores: [
      { name: "Amazon", price: 3955, url: "https://www.amazon.in/Nike-Running-Shoes-Black-Anthracite/dp/B0DYLF9JV5?tag=stylescoutin2-21" },
      { name: "Flipkart", price: 3955, url: "https://dl.flipkart.com/s/czoexUNNNN" },
      { name: "Myntra", price: 3955, url: "https://www.myntra.com/sports-shoes/nike/nike-run-defy-mens-road-running-shoes/34806262/buy" }
    ]
  },
  {
    id: "puma", name: "Puma Men Velocity Trn Running Shoe", brand: "Puma", price: 2426, category: "sneakers", oldPrice: 4799, discount: 33,
    image: "https://m.media-amazon.com/images/I/61TFZhU8ifL._SY695_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/515KDSm0QeL._SY695_.jpg", "https://rukminim1.flixcart.com/image/1536/1536/xif0q/shoe/s/c/9/-watermarked-original-imahjghvn9fhhraq.jpeg?q=90", "https://m.media-amazon.com/images/I/51LO6JDOxZL._SY695_.jpg"],
    stores: [
      { name: "Amazon", price: 2426, url: "https://www.amazon.in/Puma-Velocity-Black-Lava-Blast-Running/dp/B0BG83ZHKP?tag=stylescoutin2-21" },
      { name: "Flipkart", price: 3599, url: "https://dl.flipkart.com/s/czc_VBNNNN" }
    ]
  },
  {
    id: "boat", name: "boAt Wave Fortune Smart Watch", brand: "boAt", price: 2131, category: "watches", oldPrice: 3299, discount: 35,
    image: "https://m.media-amazon.com/images/I/61thhBuY28L._SX522_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/61Bhsjlok5L._SL1500_.jpg", "https://m.media-amazon.com/images/I/61miAQat4wL._SL1500_.jpg", "https://m.media-amazon.com/images/I/61yp2YqPQwL._SL1500_.jpg"],
    stores: [
      { name: "Myntra", price: 2131, url: "https://www.myntra.com/smart-watches/boat/boat-wave-fortune-smart-watch/30052870/buy" },
      { name: "Amazon", price: 3299, url: "https://www.amazon.in/boAt-Wave-Fortune-Bluetooth-Assistant/dp/B0D4M3NSV9?tag=stylescoutin2-21" }
    ]
  },
  {
    id: "noise", name: "Noise ColorFit Pro 4 Alpha", brand: "Noise", price: 1999, category: "watches", oldPrice: 2499, discount: 20,
    image: "https://m.media-amazon.com/images/I/61jOliJK5CL._SX522_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/61X1cTE9kLL._SL1500_.jpg", "https://m.media-amazon.com/images/I/615jI2hiFRL._SL1500_.jpg", "https://m.media-amazon.com/images/I/61tj9NjGrbL._SL1500_.jpg"],
    stores: [
      { name: "Myntra", price: 1999, url: "https://www.myntra.com/smart-watches/noise/noise-unisex-colorfit-pro-4-alpha-178-amoled-display-smart-watch/34285208/buy" },
      { name: "Amazon", price: 2499, url: "https://www.amazon.in/Noise-ColorFit-Bluetooth-instacharge-Functional/dp/B0BGSV43WY?tag=stylescoutin2-21" }
    ]
  },
  {
    id: "polo", name: "U.S. Polo Assn. Classic Shirt", brand: "U.S. Polo Assn.", price: 1699, category: "apparel", oldPrice: 1699, discount: 4,
    image: "https://m.media-amazon.com/images/I/51u8Jrjd0NL._SX679_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/61adQXXo0hL._SX679_.jpg", "https://m.media-amazon.com/images/I/51iWP0fglpL._SX679_.jpg", "https://m.media-amazon.com/images/I/512XlfVXN9L._SX679_.jpg"],
    stores: [
      { name: "Myntra", price: 1699, url: "https://www.myntra.com/shirts/u.s.+polo+assn./us-polo-assn-men-classic-spread-collar-solid-cotton-casual-shirt/30650406/buy" },
      { name: "Amazon", price: 1699, url: "https://www.amazon.in/U-S-Assn-Solid-Regular-USSHTFX0511_White/dp/B0DFCFLGPD?tag=stylescoutin2-21" }
    ]
  },
  {
    id: "roadster", name: "Roadster Striped Polo", brand: "Roadster", price: 503, category: "apparel", oldPrice: 496, discount: 0,
    image: "https://rukminim1.flixcart.com/image/800/1070/xif0q/t-shirt/x/o/b/s-37933609-roadster-original-imahksezkr8j5yxf.jpeg?q=90",
    gallery: ["https://rukminim1.flixcart.com/image/1528/1528/xif0q/t-shirt/y/5/h/s-37933609-roadster-original-imahksezgnq5zffg.jpeg?q=90", "https://rukminim1.flixcart.com/image/1528/1528/xif0q/t-shirt/j/5/o/s-37933609-roadster-original-imahksezvmfdwcfs.jpeg?q=90", "https://rukminim1.flixcart.com/image/1528/1528/xif0q/t-shirt/4/z/t/s-37933609-roadster-original-imahksezabxrwzb3.jpeg?q=90"],
    stores: [
      { name: "Myntra", price: 503, url: "https://www.myntra.com/tshirts/roadster/the-roadster-life-co-horizontal-striped-polo-collar-t-shirt/37933609/buy" },
      { name: "Flipkart", price: 496, url: "https://dl.flipkart.com/s/c6oxCONNNN" }
    ]
  },
  {
    id: "puma-shatter", name: "PUMA Court Shatter Mid", brand: "PUMA", price: 2589, category: "sneakers", oldPrice: 4000, discount: 35,
    image: "https://m.media-amazon.com/images/I/51cw59me6yL._SY695_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/51cw59me6yL._SY695_.jpg", "https://m.media-amazon.com/images/I/31xCUOQ5U0L._SS40_.jpg", "https://m.media-amazon.com/images/I/21rUwyi2ciL._SS40_.jpg"],
    stores: [
      { name: "Flipkart", price: 4000, url: "https://www.flipkart.com/puma-court-shatter-mid-sneakers-men/p/itme3f616e533d21" },
      { name: "Amazon", price: 2589, url: "https://www.amazon.in/Puma-Court-Shatter-Black-White-Sneaker/dp/B0DWK4LHFM?tag=stylescoutin2-21" },
      { name: "Myntra", price: 2589, url: "https://www.myntra.com/casual-shoes/puma/puma-court-shatter-men-sportstyle-sneakers/32695233/buy" }
    ]
  },
  {
    id: "puma-black", name: "PUMA Smashic Black Sneakers", brand: "PUMA", price: 1800, category: "sneakers", oldPrice: 2800, discount: 36,
    image: "https://m.media-amazon.com/images/I/41NtbP4mYoL._SY695_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/41NtbP4mYoL._SY695_.jpg", "https://m.media-amazon.com/images/I/31sk1RR8HUL._SS40_.jpg", "https://m.media-amazon.com/images/I/21Mi-ExhwPL._SS40_.jpg"],
    stores: [
      { name: "Flipkart", price: 2800, url: "https://www.flipkart.com/puma-smashic-sneakers-men/p/itm99621d83293b7" },
      { name: "Amazon", price: 1800, url: "https://www.amazon.in/Puma-Unisex-Adult-Smashic-Black-Matte-Sneaker/dp/B0BSLJ245T?tag=stylescoutin2-21" },
      { name: "Myntra", price: 2024, url: "https://www.myntra.com/casual-shoes/puma/puma-smashic-comfort-casual-sneakers/21767158/buy" }
    ]
  },
  {
    id: "puma-white", name: "PUMA Smashic WMN White Sneakers", brand: "PUMA", price: 1569, category: "sneakers", oldPrice: 1752, discount: 10,
    image: "https://m.media-amazon.com/images/I/51-CObvtVsL._SY675_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/51-CObvtVsL._SY675_.jpg", "https://m.media-amazon.com/images/I/31D3WVDSRIL._SS40_.jpg", "https://m.media-amazon.com/images/I/21BiJGldf0L._SS40_.jpg"],
    stores: [
      { name: "Flipkart", price: 1752, url: "https://www.flipkart.com/puma-smashic-wmn-running-shoes-women/p/itm9773001e4cc02" },
      { name: "Amazon", price: 1569, url: "https://www.amazon.in/Puma-Womens-Smashic-White-Peony-Matte-Sneaker/dp/B0BSLKNSCK?tag=stylescoutin2-21" },
      { name: "Myntra", price: 1574, url: "https://www.myntra.com/casual-shoes/puma/puma-smashic-women-comfort-casual-sneakers/21766806/buy" }
    ]
  },
{
      id: "Sparx SM S23", name: "Sparx SM 323 | Stylish, Comfortable | Sneakers For Men", brand: "Sparx", price: 629, category: "sneakers", oldPrice: 799, discount: 25,
    image: "https://m.media-amazon.com/images/I/61SjrdVQLWL._SY695_.jpg",
    gallery: ["https://m.media-amazon.com/images/I/61Uqt55AryL._SY695_.jpg",
       "https://m.media-amazon.com/images/I/71TtqkkjMvL._SY695_.jpg", 
      "https://m.media-amazon.com/images/I/61kvl75S8gL._SY695_.jpg",
    "https://m.media-amazon.com/images/I/61iFZ60PIPL._SY695_.jpg",
  "https://m.media-amazon.com/images/I/51riWl8MSFL._SY695_.jpg"
  ],
    stores: [
      { name: "Flipkart", price: 629, 
        url: "https://dl.flipkart.com/s/EzK1bgNNNN" },
      { name: "Amazon", price: 674, 
        url: "https://www.amazon.in/SPARX-SD0323G-BLACK-Sneakers-SD0323GBKWH0009/dp/B07PJ9329H?pd_rd_w=5RpG6&content-id=amzn1.sym.d5adbf9e-6741-468c-b4ab-68672b21a512&pf_rd_p=d5adbf9e-6741-468c-b4ab-68672b21a512&pf_rd_r=F2XNQKXCQ3J3AKHHXFJP&pd_rd_wg=Uc2HH&pd_rd_r=1ae81e52-ff7f-4f4a-b219-f128de051c0a&pd_rd_i=B077N6PY6M&th=1&psc=1&linkCode=ll2&tag=stylescoutin2-21&linkId=0de56070b566cb1f4024ce2db2f1df0a&ref_=as_li_ss_tl" }
    
    ]
  }

];

const $ = (id) => document.getElementById(id);
const productGrid = $("productGrid");
const modal = $("quickViewModal");
const modalMainImage = $("modalMainImage");
const modalBrand = $("modalBrand");
const modalTitle = $("modalTitle");
const modalCurrentPrice = $("modalCurrentPrice");
const modalOldPrice = $("modalOldPrice");
const modalDiscount = $("modalDiscount");
const modalStores = $("modalStores");
const closeModalBtn = $("closeModal");
const prevImage = $("prevImage");
const nextImage = $("nextImage");
const toast = $("toast");
const searchInput = $("searchInput");
const searchButton = $("searchButton");
const wishlistCount = $("wishlistCount");
const wishlistBtn = $("wishlistBtn");
const wishlistDrawer = $("wishlistDrawer");
const drawerOverlay = $("drawerOverlay");
const drawerClose = $("drawerClose");
const drawerContent = $("drawerContent");
const brandGrid = $("brandGrid");
const brandModal = $("brandModal");
const brandClose = $("brandClose");
const brandLogo = $("brandLogo");
const brandName = $("brandName");
const brandCategories = $("brandCategories");
const viewBrandProducts = $("viewBrandProducts");
const filterBar = $("filterBar");
const sortSelect = $("sortSelect");
const loginModal = $("loginModal");
const loginBtn = $("loginBtn");
const loginClose = $("loginClose");
const loginName = $("loginName");
const loginSubmit = $("loginSubmit");

let wishlist = JSON.parse(localStorage.getItem("stylescout_wishlist") || "[]");
let currentFilter = "all";
let currentImageIndex = 0;
let currentProductImages = [];

const money = (v) => `₹${v.toLocaleString("en-IN")}`;

function notify(msg) {
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2000);
}

const brands = [
  { name: "Nike", logo: "Photos/Logos/Nike.png" },
  { name: "Adidas", logo: "Photos/Logos/Adidas.png" },
  { name: "Puma", logo: "Photos/Logos/Puma.png" },
  { name: "Campus", logo: "Photos/Logos/Campus.png" },
  { name: "Asian", logo: "Photos/Logos/Asian.png" },
  { name: "U S Polo", logo: "Photos/Logos/uspolo.png" },
  { name: "Allen Solly", logo: "Photos/Logos/Allensolly.png" },
  { name: "Roadster", logo: "Photos/Logos/Roadster.png" },
  { name: "Red Tape", logo: "Photos/Logos/Redtape.png" },
  { name: "Bata", logo: "Photos/Logos/bata.png" },
  { name: "Sparx", logo: "Photos/Logos/sparx.png" },
  { name: "Casio", logo: "Photos/Logos/Casio.png" },
  { name: "Titan", logo: "Photos/Logos/Titan.png" },
  { name: "Fastrack", logo: "Photos/Logos/Fastrack.png" },
  { name: "boAt", logo: "Photos/Logos/Boat.png" },
  { name: "Noise", logo: "Photos/Logos/Noise.png" },
  { name: "Levi's", logo: "Photos/Logos/levis.png" },
  { name: "Zara", logo: "Photos/Logos/zara.png" },
  { name: "HRX", logo: "Photos/Logos/hrx.png" },
  { name: "US Polo Assn.", logo: "Photos/Logos/uspoloassn.png" },
  { name: "Peter England", logo: "Photos/Logos/peterengland.png" }
];

function renderBrands() {
  brandGrid.innerHTML = brands.map(b => `
    <button class="brand-card" data-brand="${b.name}">
      <img class="brand-logo" src="${b.logo}" alt="${b.name}" onerror="this.src='https://via.placeholder.com/150x100?text=Logo'"/>
      <span>${b.name}</span>
    </button>
  `).join('');
}

brandGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.brand-card');
  if (!card) return;
  const brand = brands.find(b => b.name === card.dataset.brand);
  brandLogo.src = brand.logo;
  brandName.textContent = brand.name;
  brandCategories.innerHTML = brand.categories ? brand.categories.map(c => `<span>${c}</span>`).join('') : '';
  brandModal.classList.add('active');
});

brandClose.addEventListener('click', () => brandModal.classList.remove('active'));
brandModal.addEventListener('click', (e) => { if (e.target === brandModal) brandModal.classList.remove('active'); });

viewBrandProducts.addEventListener('click', () => {
  currentFilter = "all";
  applyFilters();
  brandModal.classList.remove('active');
  document.getElementById('featured').scrollIntoView({ behavior: 'smooth' });
});

function renderProducts() {
  let filtered = [...products];
  if (currentFilter !== "all") filtered = filtered.filter(p => p.category === currentFilter);

  if (sortSelect.value === 'priceLow') filtered.sort((a, b) => a.price - b.price);
  if (sortSelect.value === 'priceHigh') filtered.sort((a, b) => b.price - a.price);

  if (filtered.length === 0) {
    productGrid.innerHTML = `<div class="empty-state">No products found.</div>`;
    return;
  }

  productGrid.innerHTML = filtered.map(product => {
    const isSaved = wishlist.includes(product.id);

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image-wrap">
          <button class="wishlist-btn ${isSaved ? 'active' : ''}" data-id="${product.id}">${isSaved ? '♥' : '♡'}</button>
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="card-top"><span class="brand-pill">${product.brand}</span><span class="discount-pill">-${product.discount}%</span></div>
        <h3>${product.name}</h3>
        <div class="price-row"><span class="new-price">${money(product.price)}</span><span class="old-price">${money(product.oldPrice)}</span></div>
        <button class="quick-view-btn" data-id="${product.id}">Quick View</button>
      </div>
    `;
  }).join('');

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => btn.addEventListener('click', toggleWishlist));
  document.querySelectorAll('.quick-view-btn').forEach(btn => btn.addEventListener('click', (e) => openQuickView(products.find(p => p.id === btn.dataset.id))));
}

function toggleWishlist(e) {
  const id = e.currentTarget.dataset.id;
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    e.currentTarget.classList.remove('active');
    e.currentTarget.textContent = '♡';
  } else {
    wishlist.push(id);
    e.currentTarget.classList.add('active');
    e.currentTarget.textContent = '♥';
  }
  localStorage.setItem("stylescout_wishlist", JSON.stringify(wishlist));
  wishlistCount.textContent = wishlist.length;
}

function openQuickView(product) {
  currentImageIndex = 0;
  currentProductImages = product.gallery;
  modalBrand.textContent = product.brand;
  modalTitle.textContent = product.name;
  modalCurrentPrice.textContent = money(product.price);
  modalOldPrice.textContent = money(product.oldPrice);
  modalDiscount.textContent = `-${product.discount}% off`;
  modalMainImage.src = currentProductImages[currentImageIndex];
  modalStores.innerHTML = product.stores.map(store => `
    <a class="store-card" href="${store.url}" target="_blank" style="text-decoration:none;color:inherit;">
      <span class="store-name">${store.name}</span>
      <span class="store-price">${money(store.price)}</span>
    </a>
  `).join('');
  
  modal.classList.add('visible');
  document.body.classList.add('modal-open');
}

function changeImage(direction) {
  currentImageIndex += direction;
  if (currentImageIndex < 0) currentImageIndex = currentProductImages.length - 1;
  if (currentImageIndex >= currentProductImages.length) currentImageIndex = 0;
  modalMainImage.src = currentProductImages[currentImageIndex];
}

prevImage.addEventListener('click', () => changeImage(-1));
nextImage.addEventListener('click', () => changeImage(1));

closeModalBtn.addEventListener('click', () => {
  modal.classList.remove('visible');
  document.body.classList.remove('modal-open');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('visible');
    document.body.classList.remove('modal-open');
  }
});

function applyFilters() {
  renderProducts();
}

filterBar.querySelectorAll('.filter-chip').forEach(chip => chip.addEventListener('click', () => {
  filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentFilter = chip.dataset.filter;
  applyFilters();
}));
sortSelect.addEventListener('change', applyFilters);

searchButton.addEventListener('click', () => {
  const q = searchInput.value.toLowerCase();
  if (q) {
    const filtered = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    productGrid.innerHTML = filtered.map(p => `
      <div class="product-card">
        <img src="${p.image}" style="width:100%;height:150px;object-fit:cover" />
        <h3>${p.name}</h3>
        <div class="price-row"><span class="new-price">${money(p.price)}</span></div>
      </div>
    `).join('');
  } else {
    applyFilters();
  }
});

let currentUser = localStorage.getItem("stylescout_user");
if (currentUser) loginBtn.textContent = `Hi, ${currentUser}`;

loginBtn.addEventListener('click', () => {
  if (currentUser) {
    localStorage.removeItem("stylescout_user");
    currentUser = null;
    loginBtn.textContent = "Login";
    notify("Logged out");
  } else {
    loginModal.classList.add('active');
  }
});
loginClose.addEventListener('click', () => loginModal.classList.remove('active'));
loginSubmit.addEventListener('click', () => {
  const name = loginName.value.trim();
  if (name) {
    localStorage.setItem("stylescout_user", name);
    currentUser = name;
    loginBtn.textContent = `Hi, ${name}`;
    loginModal.classList.remove('active');
    notify("Logged in!");
  }
});

// Particles
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener("resize", resize);
resize();
window.addEventListener("pointermove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  for (let i = 0; i < 2; i++) particles.push({ x: mouse.x, y: mouse.y, life: 1, size: Math.random() * 3 + 1.5, dx: (Math.random() - 0.5) * 1.5, dy: (Math.random() - 0.5) * 1.5 });
});
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx; p.y += p.dy; p.life -= 0.02; p.size *= 0.992;
    ctx.fillStyle = `rgba(120,239,198,${Math.max(p.life, 0)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    if (p.life <= 0) particles.splice(i, 1);
  }
  requestAnimationFrame(draw);
}
draw();

// INIT
renderBrands();
renderProducts();
wishlistCount.textContent = wishlist.length;

// ===== Wishlist Drawer =====
function renderWishlistDrawer() {
  if (wishlist.length === 0) {
    drawerContent.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--muted);">No saved items yet</div>`;
    return;
  }

  drawerContent.innerHTML = wishlist.map(id => {
    const p = products.find(prod => prod.id === id);
    if (!p) return '';

    return `
      <div class="drawer-item">
        <img src="${p.image}" />
        <div style="flex: 1;">
          <div style="font-size: 0.9rem; font-weight: 600;">${p.name}</div>
          <div style="font-size: 0.8rem; color: var(--green);">${money(p.price)}</div>
        </div>
        <button class="drawer-item-remove" data-id="${p.id}">🗑️</button>
      </div>
    `;
  }).join('');

  drawerContent.querySelectorAll('.drawer-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      wishlist = wishlist.filter(w => w !== id);
      localStorage.setItem("stylescout_wishlist", JSON.stringify(wishlist));
      wishlistCount.textContent = wishlist.length;
      renderProducts();
      renderWishlistDrawer();
    });
  });
}

wishlistBtn.addEventListener('click', () => {
  wishlistDrawer.classList.add('open');
  drawerOverlay.classList.add('active');
  renderWishlistDrawer();
});

drawerClose.addEventListener('click', () => {
  wishlistDrawer.classList.remove('open');
  drawerOverlay.classList.remove('active');
});

drawerOverlay.addEventListener('click', (e) => {
  if (e.target === drawerOverlay) {
    wishlistDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
  }
});
// Show Popular Chips when Brands is clicked
const brandsLink = document.querySelector('a[href="#brands"]');
if (brandsLink) {
  brandsLink.addEventListener('click', () => {
    document.body.classList.add('show-brands');
  });
}

// Also show them if they land directly on the page from the URL
if (window.location.hash === '#brands') {
  document.body.classList.add('show-brands');
}
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
const modalWishlistBtn = $("modalWishlistBtn");
const toast = $("toast");
const searchInput = $("searchInput");
const searchButton = $("searchButton");
const wishlistCount = $("wishlistCount");
const wishlistBtn = $("wishlistBtn");
const wishlistDrawer = $("wishlistDrawer");
const drawerOverlay = $("drawerOverlay");
const drawerClose = $("drawerClose");
const drawerContent = $("drawerContent");

const filterBar = $("filterBar");
const sortSelect = $("sortSelect");

const openFilterBtn = $("openFilterBtn");
const filterModal = $("filterModal");
const closeFilterBtn = $("closeFilterBtn");
const filterBrand = $("filterBrand");
const filterStore = $("filterStore");
const filterMinPrice = $("filterMinPrice");
const filterMaxPrice = $("filterMaxPrice");
const filterMinDiscount = $("filterMinDiscount");
const clearAdvancedFilters = $("clearAdvancedFilters");
const applyAdvancedFilters = $("applyAdvancedFilters");
const filterSummary = $("filterSummary");

const loginModal = $("loginModal");
const loginBtn = $("loginBtn");
const loginClose = $("loginClose");
const loginName = $("loginName");
const loginSubmit = $("loginSubmit");


let products = [];
let wishlist = JSON.parse(localStorage.getItem("stylescout_wishlist") || "[]");

let currentFilter = "all";
let currentImageIndex = 0;
let currentProductImages = [];

let advancedFilters = {
  brand: "all",
  store: "all",
  minPrice: "",
  maxPrice: "",
  minDiscount: 0
};

const money = (value) => {
  const number = Number(value) || 0;
  return `₹${number.toLocaleString("en-IN")}`;
};

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");

  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2000);
}


/* =========================================================
   FILTER SYSTEM
========================================================= */

function populateFilterOptions() {

  const brands = [
    ...new Set(
      products
        .map(product => product.brand)
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));

  const stores = [
    ...new Set(
      products
        .flatMap(product =>
          product.stores.map(store => store.name)
        )
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));


  filterBrand.innerHTML =
    `<option value="all">All brands</option>` +
    brands
      .map(
        brand =>
          `<option value="${brand}">${brand}</option>`
      )
      .join("");


  filterStore.innerHTML =
    `<option value="all">All stores</option>` +
    stores
      .map(
        store =>
          `<option value="${store}">${store}</option>`
      )
      .join("");
}


function syncFilterControls() {

  filterBrand.value = advancedFilters.brand;

  filterStore.value = advancedFilters.store;

  filterMinPrice.value = advancedFilters.minPrice;

  filterMaxPrice.value = advancedFilters.maxPrice;

  filterMinDiscount.value =
    String(advancedFilters.minDiscount);
}


function updateFilterSummary() {

  const activeFilters = [];

  if (advancedFilters.brand !== "all") {
    activeFilters.push(advancedFilters.brand);
  }

  if (advancedFilters.store !== "all") {
    activeFilters.push(advancedFilters.store);
  }

  if (advancedFilters.minPrice !== "") {
    activeFilters.push(
      `₹${Number(
        advancedFilters.minPrice
      ).toLocaleString("en-IN")} min`
    );
  }

  if (advancedFilters.maxPrice !== "") {
    activeFilters.push(
      `₹${Number(
        advancedFilters.maxPrice
      ).toLocaleString("en-IN")} max`
    );
  }

  if (Number(advancedFilters.minDiscount) > 0) {
    activeFilters.push(
      `${advancedFilters.minDiscount}%+ off`
    );
  }

  filterSummary.textContent =
    activeFilters.length
      ? activeFilters.join(" • ")
      : "No filters applied";
}


function openFilters() {

  syncFilterControls();

  filterModal.classList.add("active");

  document.body.classList.add("modal-open");
}


function closeFilters() {

  filterModal.classList.remove("active");

  document.body.classList.remove("modal-open");
}


/* Open filter */

openFilterBtn.addEventListener(
  "click",
  openFilters
);


/* Close filter */

closeFilterBtn.addEventListener(
  "click",
  closeFilters
);


/* Close when clicking outside */

filterModal.addEventListener(
  "click",
  event => {

    if (event.target === filterModal) {
      closeFilters();
    }

  }
);


/* Clear filters */

clearAdvancedFilters.addEventListener(
  "click",
  () => {

    advancedFilters = {
      brand: "all",
      store: "all",
      minPrice: "",
      maxPrice: "",
      minDiscount: 0
    };

    syncFilterControls();

    updateFilterSummary();

    applyFilters();

  }
);


/* Apply filters */

applyAdvancedFilters.addEventListener(
  "click",
  () => {

    advancedFilters = {

      brand:
        filterBrand.value || "all",

      store:
        filterStore.value || "all",

      minPrice:
        filterMinPrice.value.trim(),

      maxPrice:
        filterMaxPrice.value.trim(),

      minDiscount:
        Number(
          filterMinDiscount.value || 0
        )

    };

    updateFilterSummary();

    closeFilters();

    applyFilters();

  }
);


/* =========================================================
   PRODUCT FILTERING
========================================================= */

function getFilteredProducts() {

  let filtered = [...products];


  /* Category */

  if (currentFilter !== "all") {

    filtered = filtered.filter(
      product =>
        product.category === currentFilter
    );

  }


  /* Brand */

  if (advancedFilters.brand !== "all") {

    filtered = filtered.filter(
      product =>
        product.brand ===
        advancedFilters.brand
    );

  }


  /* Store */

  if (advancedFilters.store !== "all") {

    filtered = filtered.filter(
      product =>
        product.stores.some(
          store =>
            store.name ===
            advancedFilters.store
        )
    );

  }


  /* Minimum price */

  if (advancedFilters.minPrice !== "") {

    const minPrice =
      Number(advancedFilters.minPrice);

    if (Number.isFinite(minPrice)) {

      filtered = filtered.filter(
        product =>
          product.price >= minPrice
      );

    }

  }


  /* Maximum price */

  if (advancedFilters.maxPrice !== "") {

    const maxPrice =
      Number(advancedFilters.maxPrice);

    if (Number.isFinite(maxPrice)) {

      filtered = filtered.filter(
        product =>
          product.price <= maxPrice
      );

    }

  }


  /* Discount */

  if (
    Number(advancedFilters.minDiscount) > 0
  ) {

    filtered = filtered.filter(
      product =>
        Number(product.discount) >=
        Number(
          advancedFilters.minDiscount
        )
    );

  }


  /* Sorting */

  if (sortSelect.value === "priceLow") {

    filtered.sort(
      (a, b) =>
        a.price - b.price
    );

  }


  if (sortSelect.value === "priceHigh") {

    filtered.sort(
      (a, b) =>
        b.price - a.price
    );

  }


  if (sortSelect.value === "scoreHigh") {

    filtered.sort(
      (a, b) =>
        b.discount - a.discount
    );

  }


  if (sortSelect.value === "best") {

    filtered.sort(
      (a, b) =>
        b.discount - a.discount ||
        a.price - b.price
    );

  }


  return filtered;
}


/* =========================================================
   PRODUCT RENDER
========================================================= */

function renderProducts() {

  const filtered =
    getFilteredProducts();


  if (filtered.length === 0) {

    productGrid.innerHTML = `
      <div class="empty-state">
        No sneakers match your filters.
      </div>
    `;

    return;
  }


  productGrid.innerHTML =
    filtered
      .map(product => {

        const isSaved =
          wishlist.includes(product.id);


        return `
          <div
            class="product-card"
            data-id="${product.id}"
          >

            <div class="product-image-wrap">

              <button
                class="wishlist-btn ${
                  isSaved ? "active" : ""
                }"
                data-id="${product.id}"
              >
                ${isSaved ? "♥" : "♡"}
              </button>

              <img
                src="${product.image}"
                alt="${product.name}"
              />

            </div>


            <div class="card-top">

              <span class="brand-pill">
                ${product.brand}
              </span>

              <span class="discount-pill">
                -${product.discount}%
              </span>

            </div>


            <h3>
              ${product.name}
            </h3>


            <div class="price-row">

              <span class="new-price">
                ${money(product.price)}
              </span>

              <span class="old-price">
                ${money(product.oldPrice)}
              </span>

            </div>


            <button
              class="quick-view-btn"
              data-id="${product.id}"
            >
              Quick View
            </button>

          </div>
        `;

      })
      .join("");


  bindEvents();
}


/* =========================================================
   PRODUCT EVENTS
========================================================= */

function bindEvents() {

  document
    .querySelectorAll(".wishlist-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        toggleWishlist
      );

    });


  document
    .querySelectorAll(".quick-view-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const product =
            products.find(
              item =>
                item.id ===
                button.dataset.id
            );

          if (product) {
            openQuickView(product);
          }

        }
      );

    });

}


/* =========================================================
   WISHLIST
========================================================= */

function toggleWishlist(event) {

  const id =
    event.currentTarget.dataset.id;


  if (wishlist.includes(id)) {

    wishlist =
      wishlist.filter(
        item => item !== id
      );

    event.currentTarget.classList.remove(
      "active"
    );

    event.currentTarget.textContent = "♡";

  } else {

    wishlist.push(id);

    event.currentTarget.classList.add(
      "active"
    );

    event.currentTarget.textContent = "♥";

  }


  localStorage.setItem(
    "stylescout_wishlist",
    JSON.stringify(wishlist)
  );


  wishlistCount.textContent =
    wishlist.length;
}


/* =========================================================
   QUICK VIEW
========================================================= */

function openQuickView(product) {

  currentImageIndex = 0;

  currentProductImages =
    Array.isArray(product.gallery) &&
    product.gallery.length
      ? product.gallery
      : [product.image];


  modalBrand.textContent =
    product.brand;

  modalTitle.textContent =
    product.name;

  modalCurrentPrice.textContent =
    money(product.price);

  modalOldPrice.textContent =
    money(product.oldPrice);

  modalDiscount.textContent =
    `-${product.discount}% off`;


  modalMainImage.src =
    currentProductImages[
      currentImageIndex
    ];


  const lowestPrice = Math.min(...product.stores.map(s => s.price));

  modalStores.innerHTML =
    product.stores
      .map(store => {
        const isBest = store.price === lowestPrice;
        return `
          <a
            class="store-card ${isBest ? "best-price" : ""}"
            href="${store.url}"
            target="_blank"
            rel="noopener noreferrer"
            onclick="gtag('event','store_click',{store_name:'${store.name}',product_id:'${product.id}',price:${store.price}})"
            style="
              text-decoration:none;
              color:inherit;
            "
          >
            <span class="store-name">
              ${store.name}
              ${isBest ? '<span class="best-badge">BEST</span>' : ''}
            </span>
            <span class="store-price">
              ${money(store.price)}
            </span>
          </a>
        `;
      })
      .join("");

  modalStores.innerHTML += `<a href="products/${product.id}.html" style="display:block;text-align:center;margin-top:14px;color:#78efc6;text-decoration:none;font-size:13px;font-weight:600;">View full details →</a>`;

  modalWishlistBtn.dataset.id =
    product.id;


  const isSaved =
    wishlist.includes(product.id);


  modalWishlistBtn.classList.toggle(
    "active",
    isSaved
  );


  modalWishlistBtn.textContent =
    isSaved ? "♥" : "♡";


  modal.classList.add("visible");

  document.body.classList.add(
    "modal-open"
  );
}


function changeImage(direction) {

  if (
    !currentProductImages.length
  ) {
    return;
  }


  currentImageIndex += direction;


  if (currentImageIndex < 0) {

    currentImageIndex =
      currentProductImages.length - 1;

  }


  if (
    currentImageIndex >=
    currentProductImages.length
  ) {

    currentImageIndex = 0;

  }


  modalMainImage.src =
    currentProductImages[
      currentImageIndex
    ];
}


prevImage.addEventListener(
  "click",
  () => changeImage(-1)
);

nextImage.addEventListener(
  "click",
  () => changeImage(1)
);

modalWishlistBtn.addEventListener(
  "click",
  toggleWishlist
);


closeModalBtn.addEventListener(
  "click",
  () => {

    modal.classList.remove(
      "visible"
    );

    document.body.classList.remove(
      "modal-open"
    );

  }
);


modal.addEventListener(
  "click",
  event => {

    if (event.target === modal) {

      modal.classList.remove(
        "visible"
      );

      document.body.classList.remove(
        "modal-open"
      );

    }

  }
);


/* =========================================================
   FILTER BAR + SORT
========================================================= */

function applyFilters() {

  renderProducts();

}


filterBar
  .querySelectorAll(".filter-chip")
  .forEach(chip => {

    chip.addEventListener(
      "click",
      () => {

        filterBar
          .querySelectorAll(
            ".filter-chip"
          )
          .forEach(item =>
            item.classList.remove(
              "active"
            )
          );


        chip.classList.add(
          "active"
        );


        currentFilter =
          chip.dataset.filter;


        applyFilters();

      }
    );

  });


sortSelect.addEventListener(
  "change",
  applyFilters
);


/* =========================================================
   SEARCH
========================================================= */

searchButton.addEventListener(
  "click",
  () => {

    const query =
      searchInput.value
        .trim()
        .toLowerCase();


    if (!query) {

      applyFilters();

      return;
    }


    let filtered =
      getFilteredProducts()
        .filter(product =>

          product.name
            .toLowerCase()
            .includes(query)

          ||

          product.brand
            .toLowerCase()
            .includes(query)

          ||

          product.stores.some(store =>
            store.name
              .toLowerCase()
              .includes(query)
          )

        );


    if (filtered.length === 0) {

      productGrid.innerHTML = `
        <div class="empty-state">
          No sneakers found for "${query}".
        </div>
      `;

      return;
    }


    productGrid.innerHTML =
      filtered
        .map(product => {

          const isSaved =
            wishlist.includes(
              product.id
            );


          return `
            <div
              class="product-card"
              data-id="${product.id}"
            >

              <div class="product-image-wrap">

                <button
                  class="wishlist-btn ${
                    isSaved
                      ? "active"
                      : ""
                  }"
                  data-id="${product.id}"
                >
                  ${
                    isSaved
                      ? "♥"
                      : "♡"
                  }
                </button>

                <img
                  src="${product.image}"
                  alt="${product.name}"
                />

              </div>


              <div class="card-top">

                <span class="brand-pill">
                  ${product.brand}
                </span>

                <span class="discount-pill">
                  -${product.discount}%
                </span>

              </div>


              <h3>
                ${product.name}
              </h3>


              <div class="price-row">

                <span class="new-price">
                  ${money(product.price)}
                </span>

                <span class="old-price">
                  ${money(product.oldPrice)}
                </span>

              </div>


              <button
                class="quick-view-btn"
                data-id="${product.id}"
              >
                Quick View
              </button>

            </div>
          `;

        })
        .join("");


    bindEvents();

  }
);


/* Press Enter to search */

searchInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      searchButton.click();

    }

  }
);


/* =========================================================
   LOGIN
========================================================= */

let currentUser =
  localStorage.getItem(
    "stylescout_user"
  );


if (currentUser) {

  loginBtn.textContent =
    `Hi, ${currentUser}`;

}


loginBtn.addEventListener(
  "click",
  () => {

    if (currentUser) {

      localStorage.removeItem(
        "stylescout_user"
      );

      currentUser = null;

      loginBtn.textContent =
        "Login";

      notify(
        "Logged out"
      );

    } else {

      loginModal.classList.add(
        "active"
      );

    }

  }
);


loginClose.addEventListener(
  "click",
  () =>
    loginModal.classList.remove(
      "active"
    )
);


loginSubmit.addEventListener(
  "click",
  () => {

    const name =
      loginName.value.trim();


    if (!name) {
      return;
    }


    localStorage.setItem(
      "stylescout_user",
      name
    );


    currentUser = name;

    loginBtn.textContent =
      `Hi, ${name}`;


    loginModal.classList.remove(
      "active"
    );


    notify(
      "Logged in!"
    );

  }
);


/* =========================================================
   PARTICLES
========================================================= */

const canvas =
  document.getElementById(
    "particleCanvas"
  );

const ctx =
  canvas.getContext("2d");


let particles = [];


let mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
};


function resize() {

  canvas.width =
    window.innerWidth;

  canvas.height =
    window.innerHeight;

}


window.addEventListener(
  "resize",
  resize
);


resize();


window.addEventListener(
  "pointermove",
  event => {

    mouse.x =
      event.clientX;

    mouse.y =
      event.clientY;


    for (
      let i = 0;
      i < 2;
      i++
    ) {

      particles.push({

        x: mouse.x,

        y: mouse.y,

        life: 1,

        size:
          Math.random() * 3 + 1.5,

        dx:
          (Math.random() - 0.5) * 1.5,

        dy:
          (Math.random() - 0.5) * 1.5

      });

    }

  }
);


function draw() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  for (
    let i =
      particles.length - 1;
    i >= 0;
    i--
  ) {

    const particle =
      particles[i];


    particle.x +=
      particle.dx;

    particle.y +=
      particle.dy;

    particle.life -=
      0.02;

    particle.size *=
      0.992;


    ctx.fillStyle =
      `rgba(
        120,
        239,
        198,
        ${Math.max(
          particle.life,
          0
        )}
      )`;


    ctx.beginPath();

    ctx.arc(
      particle.x,
      particle.y,
      particle.size,
      0,
      Math.PI * 2
    );

    ctx.fill();


    if (
      particle.life <= 0
    ) {

      particles.splice(
        i,
        1
      );

    }

  }


  requestAnimationFrame(
    draw
  );

}


draw();




/* =========================================================
   WISHLIST DRAWER
========================================================= */

function renderWishlistDrawer() {

  if (wishlist.length === 0) {

    drawerContent.innerHTML = `
      <div
        style="
          padding:40px;
          text-align:center;
          color:var(--muted);
        "
      >
        No saved items yet
      </div>
    `;

    return;
  }


  drawerContent.innerHTML =
    wishlist
      .map(id => {

        const product =
          products.find(
            item =>
              item.id === id
          );


        if (!product) {
          return "";
        }


        return `
          <div
            class="drawer-item"
          >

            <img
              src="${product.image}"
            />

            <div
              style="
                flex:1;
              "
            >

              <div
                style="
                  font-size:.9rem;
                  font-weight:600;
                "
              >
                ${product.name}
              </div>

              <div
                style="
                  font-size:.8rem;
                  color:var(--green);
                "
              >
                ${money(product.price)}
              </div>

            </div>


            <button
              class="drawer-item-remove"
              data-id="${product.id}"
            >
              🗑️
            </button>

          </div>
        `;

      })
      .join("");


  drawerContent
    .querySelectorAll(
      ".drawer-item-remove"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const id =
            button.dataset.id;


          wishlist =
            wishlist.filter(
              item =>
                item !== id
            );


          localStorage.setItem(
            "stylescout_wishlist",
            JSON.stringify(
              wishlist
            )
          );


          wishlistCount.textContent =
            wishlist.length;


          renderProducts();

          renderWishlistDrawer();

        }
      );

    });

}


wishlistBtn.addEventListener(
  "click",
  () => {

    wishlistDrawer.classList.add(
      "open"
    );

    drawerOverlay.classList.add(
      "active"
    );

    renderWishlistDrawer();

  }
);


drawerClose.addEventListener(
  "click",
  () => {

    wishlistDrawer.classList.remove(
      "open"
    );

    drawerOverlay.classList.remove(
      "active"
    );

  }
);


drawerOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      drawerOverlay
    ) {

      wishlistDrawer.classList.remove(
        "open"
      );

      drawerOverlay.classList.remove(
        "active"
      );

    }

  }
);

/* =========================================================
   LOAD PRODUCTS FROM products.json
========================================================= */

(async function loadProductsFromJson() {
  try {
    const res = await fetch("products.json?t=" + Date.now());
    if (!res.ok) throw new Error("products.json not found");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("products.json is not an array");

    products.length = 0;
    products.push(...data.filter(p => p.category === "sneakers"));

    console.log(`✓ Loaded ${products.length} sneakers from products.json`);

    populateFilterOptions();
    syncFilterControls();
    updateFilterSummary();
    renderProducts();
    wishlistCount.textContent = wishlist.length;

  } catch (e) {
    console.warn("Could not load products.json:", e.message);
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="empty-state">
          No products loaded. Make sure products.json exists next to index.html.
        </div>`;
    }
  }
})();
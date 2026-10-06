/* =========================================================
   FIREBASE CONFIG (Lazy Loaded)
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDQcq41-886LOst86kT19mg_U1GGX-0Dzg",
  authDomain: "stylescout-6e2b6.firebaseapp.com",
  projectId: "stylescout-6e2b6",
  storageBucket: "stylescout-6e2b6.firebasestorage.app",
  messagingSenderId: "154142480948",
  appId: "1:154142480948:web:4a7d7367123491bdd48861"
};

let auth = null;
let googleProvider = null;
let signInWithPopup = null;
let signOut = null;
let onAuthStateChanged = null;
let firebaseInitialized = false;

/* =========================================================
   DOM HELPERS
========================================================= */

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
const voiceSearchBtn = $("voiceSearchBtn");
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
const googleSignInBtn = $("googleSignInBtn");


let products = [];

let wishlist = JSON.parse(
  localStorage.getItem("stylescout_wishlist") || "[]"
);

let currentFilter = "all";
let currentImageIndex = 0;
let currentProductImages = [];
let currentAuthUser = null;

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

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("visible");

  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2000);
}


/* =========================================================
   PRODUCT SCHEMA (SEO)
   Injects JSON-LD structured data for Google Rich Results.
========================================================= */

function injectProductSchema(list) {
  const container = document.getElementById("productSchema");
  if (container) container.remove();

  if (!Array.isArray(list) || list.length === 0) return;

  const itemListElement = list.map((product, index) => {
    const offers = (Array.isArray(product.stores) ? product.stores : [])
      .filter(s => s && s.url)
      .map(store => ({
        "@type": "Offer",
        "url": store.url,
        "priceCurrency": "INR",
        "price": String(Number(store.price) || 0),
        "availability": "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": store.name }
      }));

    return {
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.fullName || product.name,
        "image": (Array.isArray(product.gallery) && product.gallery.length)
          ? product.gallery
          : [product.image],
        "description":
          (product.fullName || product.name) +
          " — Compare prices across Amazon, Flipkart, and Myntra on StyleScout.",
        "brand": { "@type": "Brand", "name": product.brand || "Unknown" },
        "sku": product.id,
        "category": "Sneakers",
        "offers": offers
      }
    };
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Sneaker Price Comparison — StyleScout",
    "url": "https://www.mystylescout.in/",
    "numberOfItems": itemListElement.length,
    "itemListElement": itemListElement
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "productSchema";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}


/* =========================================================
   FILTER SYSTEM
========================================================= */

function populateFilterOptions() {

  if (!filterBrand || !filterStore) return;

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
          Array.isArray(product.stores)
            ? product.stores.map(store => store.name)
            : []
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

  if (filterBrand) {
    filterBrand.value = advancedFilters.brand;
  }

  if (filterStore) {
    filterStore.value = advancedFilters.store;
  }

  if (filterMinPrice) {
    filterMinPrice.value = advancedFilters.minPrice;
  }

  if (filterMaxPrice) {
    filterMaxPrice.value = advancedFilters.maxPrice;
  }

  if (filterMinDiscount) {
    filterMinDiscount.value =
      String(advancedFilters.minDiscount);
  }
}


function updateFilterSummary() {

  if (!filterSummary) return;

  const activeFilters = [];


  if (advancedFilters.brand !== "all") {
    activeFilters.push(
      advancedFilters.brand
    );
  }


  if (advancedFilters.store !== "all") {
    activeFilters.push(
      advancedFilters.store
    );
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

  if (filterModal) {
    filterModal.classList.add("active");
  }

  document.body.classList.add("modal-open");
}


function closeFilters() {

  if (filterModal) {
    filterModal.classList.remove("active");
  }

  document.body.classList.remove("modal-open");
}


if (openFilterBtn) {
  openFilterBtn.addEventListener(
    "click",
    openFilters
  );
}


if (closeFilterBtn) {
  closeFilterBtn.addEventListener(
    "click",
    closeFilters
  );
}


if (filterModal) {
  filterModal.addEventListener(
    "click",
    event => {
      if (event.target === filterModal) {
        closeFilters();
      }
    }
  );
}


if (clearAdvancedFilters) {
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
}


if (applyAdvancedFilters) {
  applyAdvancedFilters.addEventListener(
    "click",
    () => {

      advancedFilters = {

        brand:
          filterBrand
            ? filterBrand.value || "all"
            : "all",

        store:
          filterStore
            ? filterStore.value || "all"
            : "all",

        minPrice:
          filterMinPrice
            ? filterMinPrice.value.trim()
            : "",

        maxPrice:
          filterMaxPrice
            ? filterMaxPrice.value.trim()
            : "",

        minDiscount:
          filterMinDiscount
            ? Number(filterMinDiscount.value || 0)
            : 0

      };

      updateFilterSummary();

      closeFilters();

      applyFilters();

    }
  );
}


/* =========================================================
   PRODUCT FILTERING
========================================================= */

function getFilteredProducts() {

  let filtered = [...products];


  if (currentFilter !== "all") {

    filtered = filtered.filter(
      product =>
        product.category === currentFilter
    );

  }


  if (advancedFilters.brand !== "all") {

    filtered = filtered.filter(
      product =>
        product.brand ===
        advancedFilters.brand
    );

  }


  if (advancedFilters.store !== "all") {

    filtered = filtered.filter(
      product =>
        Array.isArray(product.stores) &&
        product.stores.some(
          store =>
            store.name ===
            advancedFilters.store
        )
    );

  }


  if (advancedFilters.minPrice !== "") {

    const minPrice =
      Number(advancedFilters.minPrice);

    if (Number.isFinite(minPrice)) {

      filtered = filtered.filter(
        product =>
          Number(product.price) >= minPrice
      );

    }

  }


  if (advancedFilters.maxPrice !== "") {

    const maxPrice =
      Number(advancedFilters.maxPrice);

    if (Number.isFinite(maxPrice)) {

      filtered = filtered.filter(
        product =>
          Number(product.price) <= maxPrice
      );

    }

  }


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


  if (
    sortSelect &&
    sortSelect.value === "priceLow"
  ) {
    filtered.sort(
      (a, b) =>
        Number(a.price) -
        Number(b.price)
    );
  }


  if (
    sortSelect &&
    sortSelect.value === "priceHigh"
  ) {
    filtered.sort(
      (a, b) =>
        Number(b.price) -
        Number(a.price)
    );
  }


  if (
    sortSelect &&
    sortSelect.value === "scoreHigh"
  ) {
    filtered.sort(
      (a, b) =>
        Number(b.discount) -
        Number(a.discount)
    );
  }


  if (
    sortSelect &&
    sortSelect.value === "best"
  ) {
    filtered.sort(
      (a, b) =>
        Number(b.discount) -
          Number(a.discount) ||
        Number(a.price) -
          Number(b.price)
    );
  }


  return filtered;
}


/* =========================================================
   PRODUCT RENDER
========================================================= */

function renderProducts() {

  if (!productGrid) return;

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
                type="button"
              >
                ${
                  isSaved
                    ? "♥"
                    : "♡"
                }
              </button>

              <img
                src="${product.image}"
                alt="${product.fullName || product.name} — ${product.brand || ''}"
                loading="lazy"
              />

            </div>


            <div class="card-top">

              <span class="brand-pill">
                ${product.brand || ""}
              </span>

              <span class="discount-pill">
                -${Number(product.discount) || 0}%
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
              type="button"
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


    event.currentTarget.textContent =
      "♡";

  } else {

    wishlist.push(id);


    event.currentTarget.classList.add(
      "active"
    );


    event.currentTarget.textContent =
      "♥";

  }


  localStorage.setItem(
    "stylescout_wishlist",
    JSON.stringify(wishlist)
  );


  if (wishlistCount) {
    wishlistCount.textContent =
      wishlist.length;
  }

}


/* =========================================================
   QUICK VIEW
========================================================= */

function openQuickView(product) {

  if (!modal) return;

  currentImageIndex = 0;


  currentProductImages =
    Array.isArray(product.gallery) &&
    product.gallery.length
      ? product.gallery
      : [product.image];


  if (modalBrand) {
    modalBrand.textContent =
      product.brand;
  }


  if (modalTitle) {
    modalTitle.textContent =
      product.name;
  }


  if (modalCurrentPrice) {
    modalCurrentPrice.textContent =
      money(product.price);
  }


  if (modalOldPrice) {
    modalOldPrice.textContent =
      money(product.oldPrice);
  }


  if (modalDiscount) {
    modalDiscount.textContent =
      `-${product.discount}% off`;
  }


  if (modalMainImage) {
    modalMainImage.src =
      currentProductImages[
        currentImageIndex
      ];
  }


  const lowestPrice =
    Array.isArray(product.stores) &&
    product.stores.length
      ? Math.min(
          ...product.stores.map(
            s => Number(s.price) || 0
          )
        )
      : 0;


  if (modalStores) {

    modalStores.innerHTML =
      (Array.isArray(product.stores)
        ? product.stores
        : []
      )
        .map(store => {

          const isBest =
            Number(store.price) ===
            lowestPrice;


                   return `
            <a
              class="store-card ${
                isBest ? "best-price" : ""
              }"
              href="${store.url || "#"}"
              target="_blank"
              rel="sponsored nofollow noopener"
              onclick="gtag('event','store_click',{store_name:'${store.name}',product_id:'${product.id}',price:${Number(store.price) || 0}})"
              style="
                text-decoration:none;
                color:inherit;
              "
            >
              <span class="store-name">
                ${store.name}
                ${isBest ? '<span class="best-badge">BEST</span>' : ''}
              </span>
              <span class="store-right">
                <span class="store-price">${money(store.price)}</span>
                <span class="buy-now-btn">Buy Now →</span>
              </span>
            </a>
          `;
        })
        .join("");


    modalStores.innerHTML += `
      <a
        href="products/${product.id}.html"
        style="
          display:block;
          text-align:center;
          margin-top:14px;
          color:#78efc6;
          text-decoration:none;
          font-size:15px;
          font-weight:600;
        "
      >
        View full details →
      </a>
    `;

  }


  if (modalWishlistBtn) {

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

  }


  modal.classList.add("visible");

  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
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


  if (modalMainImage) {

    modalMainImage.src =
      currentProductImages[
        currentImageIndex
      ];

  }

}


if (prevImage) {
  prevImage.addEventListener(
    "click",
    () => changeImage(-1)
  );
}


if (nextImage) {
  nextImage.addEventListener(
    "click",
    () => changeImage(1)
  );
}


if (modalWishlistBtn) {
  modalWishlistBtn.addEventListener(
    "click",
    toggleWishlist
  );
}


if (closeModalBtn) {
  closeModalBtn.addEventListener(
    "click",
    () => {

      modal.classList.remove(
        "visible"
      );

      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");

    }
  );
}


if (modal) {
  modal.addEventListener(
    "click",
    event => {

      if (event.target === modal) {

        modal.classList.remove(
          "visible"
        );

        document.documentElement.classList.remove("modal-open");
        document.body.classList.remove("modal-open");

      }

    }
  );
}


/* =========================================================
   FILTER BAR + SORT
========================================================= */

function applyFilters() {

  renderProducts();

}


if (filterBar) {

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

}


if (sortSelect) {
  sortSelect.addEventListener(
    "change",
    applyFilters
  );
}


/* =========================================================
   SEARCH
========================================================= */

function renderSearchResults(filtered) {

  if (!productGrid) return;


  if (filtered.length === 0) {

    const query =
      searchInput
        ? searchInput.value.trim()
        : "";


    productGrid.innerHTML = `
      <div class="empty-state">
        No sneakers found${
          query
            ? ` for "${query}"`
            : ""
        }.
      </div>
    `;

    return;
  }


  productGrid.innerHTML =
    filtered.map(product => {

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
                isSaved
                  ? "active"
                  : ""
              }"
              data-id="${product.id}"
              type="button"
            >
              ${
                isSaved
                  ? "♥"
                  : "♡"
              }
            </button>


            <img
              src="${product.image}"
              alt="${product.fullName || product.name} — ${product.brand || ''}"
              loading="lazy"
            />

          </div>


          <div class="card-top">

            <span class="brand-pill">
              ${product.brand || ""}
            </span>

            <span class="discount-pill">
              -${Number(product.discount) || 0}%
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
            type="button"
          >
            Quick View
          </button>

        </div>
      `;

    }).join("");


  bindEvents();
}


function runSearch() {

  if (!searchInput || !productGrid) {
    return;
  }


  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  if (!query) {

    applyFilters();

    return;
  }


  const baseProducts =
    getFilteredProducts();


  const filtered =
    baseProducts.filter(product => {

      const name =
        String(
          product.name || ""
        ).toLowerCase();


      const brand =
        String(
          product.brand || ""
        ).toLowerCase();


      const category =
        String(
          product.category || ""
        ).toLowerCase();


      const stores =
        Array.isArray(product.stores)
          ? product.stores.map(
              store =>
                String(
                  store.name || ""
                ).toLowerCase()
            )
          : [];


      return (
        name.includes(query) ||
        brand.includes(query) ||
        category.includes(query) ||
        stores.some(
          store =>
            store.includes(query)
        )
      );

    });


  renderSearchResults(filtered);


  const featured =
    document.getElementById(
      "featured"
    );


  if (featured) {

    featured.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


if (searchButton && searchInput) {

  searchButton.addEventListener(
    "click",
    runSearch
  );


  searchInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        runSearch();

      }

    }
  );

}


/* =========================================================
   VOICE SEARCH
========================================================= */

function setupVoiceSearch() {

  if (
    !voiceSearchBtn ||
    !searchInput
  ) {
    return;
  }


  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {
    voiceSearchBtn.style.display = "none";
    return;
  }


  const recognition =
    new SpeechRecognition();


  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let listening = false;


  function resetVoiceButton() {

    listening = false;

    voiceSearchBtn.classList.remove(
      "listening"
    );

    voiceSearchBtn.removeAttribute(
      "aria-busy"
    );

    voiceSearchBtn.title =
      "Search by voice";

    searchInput.placeholder =
      "Search sneakers, brands, or stores...";

  }


  recognition.addEventListener(
    "start",
    () => {

      listening = true;

      voiceSearchBtn.classList.add(
        "listening"
      );

      voiceSearchBtn.setAttribute(
        "aria-busy",
        "true"
      );

      voiceSearchBtn.title =
        "Listening...";

      searchInput.placeholder =
        "Listening...";

    }
  );


  recognition.addEventListener(
    "result",
    event => {

      const result =
        event.results &&
        event.results[0] &&
        event.results[0][0];

      const transcript =
        result
          ? result.transcript.trim()
          : "";


      if (!transcript) {
        resetVoiceButton();
        return;
      }

      searchInput.value = transcript;
      resetVoiceButton();
      runSearch();

    }
  );


  recognition.addEventListener(
    "error",
    event => {

      resetVoiceButton();


      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        notify("Microphone permission is blocked");
      } else if (
        event.error !== "aborted" &&
        event.error !== "no-speech"
      ) {
        notify("Voice search couldn't start");
      }

    }
  );


  recognition.addEventListener(
    "end",
    resetVoiceButton
  );


  voiceSearchBtn.addEventListener(
    "click",
    () => {

      if (listening) {
        recognition.stop();
        return;
      }

      try {
        recognition.start();
      } catch (error) {
        resetVoiceButton();
      }

    }
  );

}


setupVoiceSearch();


/* =========================================================
   LOGIN (Firebase Google Auth — Lazy Loaded)
========================================================= */

async function initFirebase() {
  if (firebaseInitialized) return;
  
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js");
    const { getAuth, GoogleAuthProvider, signInWithPopup: sip, signOut: so, onAuthStateChanged: osac } = await import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js");

    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    
    signInWithPopup = sip;
    signOut = so;
    onAuthStateChanged = osac;
    firebaseInitialized = true;

    // Set up auth state listener now that Firebase is loaded
    onAuthStateChanged(auth, (user) => {
      currentAuthUser = user;
      if (user) {
        const name = user.displayName || user.email || "User";
        const firstName = name.split(" ")[0];
        if (loginBtn) {
          loginBtn.textContent = `Hi, ${firstName}`;
          loginBtn.style.cursor = "pointer";
        }
        const nameEl = document.getElementById("userMenuName");
        const emailEl = document.getElementById("userMenuEmail");
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = user.email || "";
        localStorage.setItem("stylescout_user", name);
      } else {
        if (loginBtn) {
          loginBtn.textContent = "Login";
          loginBtn.style.cursor = "pointer";
        }
        userMenu.style.display = "none";
        localStorage.removeItem("stylescout_user");
      }
    });

  } catch (error) {
    console.error("Failed to load Firebase:", error);
  }
}

function closeLoginModal() {
  if (loginModal) loginModal.classList.remove("active");
}

function openLoginModal() {
  if (loginModal) loginModal.classList.add("active");
}

// Build the user dropdown once, appended to body
const userMenu = document.createElement("div");
userMenu.id = "userMenu";
userMenu.style.cssText = `
  position: fixed;
  background: #0d1b18;
  border: 1px solid rgba(120,239,198,0.2);
  border-radius: 12px;
  padding: 12px;
  min-width: 240px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  z-index: 99999;
  font-family: 'Poppins', sans-serif;
  display: none;
`;

userMenu.innerHTML = `
  <div style="padding: 8px 12px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px;">
    <div id="userMenuName" style="font-weight: 600; color: #fff; font-size: 14px;"></div>
    <div id="userMenuEmail" style="font-size: 12px; color: #7d8590; margin-top: 2px;"></div>
  </div>
  <button id="logoutMenuItem" type="button" style="
    width: 100%;
    padding: 10px 12px;
    background: rgba(218,54,51,0.15);
    border: 1px solid rgba(218,54,51,0.4);
    color: #ff6b6b;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    font-family: 'Poppins', sans-serif;
    transition: background 0.15s;
  ">Log out</button>
`;

document.body.appendChild(userMenu);

// Login button — toggle dropdown when signed in, open modal when signed out
if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    // Initialize Firebase only when the user clicks Login
    await initFirebase();

    if (currentAuthUser) {
      const isOpen = userMenu.style.display === "block";
      if (isOpen) {
        userMenu.style.display = "none";
      } else {
        // Position right under the button
        const rect = loginBtn.getBoundingClientRect();
        userMenu.style.position = "fixed";
        userMenu.style.top = (rect.bottom + 8) + "px";
        userMenu.style.right = (window.innerWidth - rect.right) + "px";
        userMenu.style.display = "block";
      }
    } else {
      openLoginModal();
    }
  });
}
// Log out
document.getElementById("logoutMenuItem").addEventListener("click", () => {
  if (signOut && auth) {
    signOut(auth)
      .then(() => {
        userMenu.style.display = "none";
        notify("Logged out");
      })
      .catch(() => notify("Logout failed"));
  }
});

// Close dropdown when clicking anywhere else
document.addEventListener("click", (e) => {
  if (
    userMenu.style.display === "block" &&
    !userMenu.contains(e.target) &&
    e.target !== loginBtn
  ) {
    userMenu.style.display = "none";
  }
});

// Close modal
if (loginClose) {
  loginClose.addEventListener("click", closeLoginModal);
}

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) closeLoginModal();
  });
}

// Google sign-in
if (googleSignInBtn) {
  googleSignInBtn.addEventListener("click", async () => {
    if (!signInWithPopup || !auth) {
      await initFirebase();
    }
    
    if (!signInWithPopup || !auth) {
      notify("Auth service unavailable. Try again.");
      return;
    }

    googleSignInBtn.disabled = true;
    const original = googleSignInBtn.innerHTML;
    googleSignInBtn.textContent = "Signing in…";

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const name = result.user.displayName || result.user.email || "User";
      notify(`Welcome, ${name.split(" ")[0]}!`);
      closeLoginModal();
    } catch (err) {
      if (err && err.code === "auth/popup-closed-by-user") {
        // silent
      } else if (err && err.code === "auth/popup-blocked") {
        notify("Popup blocked. Allow popups and try again.");
      } else {
        console.warn("Sign-in error:", err);
        notify("Sign-in failed. Try again.");
      }
    } finally {
      googleSignInBtn.disabled = false;
      googleSignInBtn.innerHTML = original;
    }
  });
}


/* =========================================================
   PARTICLES
========================================================= */

if (window.innerWidth > 680) {

  const canvas = document.getElementById("particleCanvas");

  if (canvas) {

    const ctx = canvas.getContext("2d");

    let particles = [];

    let mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resize);
    resize();

    window.addEventListener(
      "pointermove",
      event => {

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        for (let i = 0; i < 2; i++) {
          particles.push({
            x: mouse.x,
            y: mouse.y,
            life: 1,
            size: Math.random() * 3 + 1.5,
            dx: (Math.random() - 0.5) * 1.5,
            dy: (Math.random() - 0.5) * 1.5
          });
        }

      }
    );

    function draw() {

      ctx.clearRect(
        0, 0,
        canvas.width,
        canvas.height
      );

      for (let i = particles.length - 1; i >= 0; i--) {

        const particle = particles[i];

        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life -= 0.02;
        particle.size *= 0.992;

        ctx.fillStyle =
          `rgba(120, 239, 198, ${Math.max(particle.life, 0)})`;

        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          particle.size,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (particle.life <= 0) {
          particles.splice(i, 1);
        }

      }

      requestAnimationFrame(draw);

    }

    draw();

  }
}


/* =========================================================
   WISHLIST DRAWER
========================================================= */

function renderWishlistDrawer() {

  if (!drawerContent) return;


  if (wishlist.length === 0) {

    drawerContent.innerHTML = `
      <div style="padding:40px;text-align:center;color:var(--muted);">
        No saved items yet
      </div>
    `;

    return;
  }


  drawerContent.innerHTML =
    wishlist
      .map(id => {

        const product =
          products.find(item => item.id === id);

        if (!product) return "";


        return `
          <div class="drawer-item">

            <img
              src="${product.image}"
              alt="${product.fullName || product.name}"
              loading="lazy"
            />

            <div style="flex:1;">

              <div style="font-size:.9rem;font-weight:600;">
                ${product.name}
              </div>

              <div style="font-size:.8rem;color:var(--green);">
                ${money(product.price)}
              </div>

            </div>

            <button
              class="drawer-item-remove"
              data-id="${product.id}"
              type="button"
            >
              🗑️
            </button>

          </div>
        `;

      })
      .join("");


  drawerContent
    .querySelectorAll(".drawer-item-remove")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          const id = button.dataset.id;

          wishlist =
            wishlist.filter(item => item !== id);

          localStorage.setItem(
            "stylescout_wishlist",
            JSON.stringify(wishlist)
          );

          if (wishlistCount) {
            wishlistCount.textContent = wishlist.length;
          }

          renderProducts();
          renderWishlistDrawer();

        }
      );

    });

}


if (wishlistBtn) {
  wishlistBtn.addEventListener(
    "click",
    () => {

      if (wishlistDrawer) {
        wishlistDrawer.classList.add("open");
      }

      if (drawerOverlay) {
        drawerOverlay.classList.add("active");
      }

      renderWishlistDrawer();

    }
  );
}


if (drawerClose) {
  drawerClose.addEventListener(
    "click",
    () => {

      if (wishlistDrawer) {
        wishlistDrawer.classList.remove("open");
      }

      if (drawerOverlay) {
        drawerOverlay.classList.remove("active");
      }

    }
  );
}


if (drawerOverlay) {
  drawerOverlay.addEventListener(
    "click",
    event => {

      if (event.target === drawerOverlay) {

        if (wishlistDrawer) {
          wishlistDrawer.classList.remove("open");
        }

        drawerOverlay.classList.remove("active");

      }

    }
  );
}


/* =========================================================
   LOAD PRODUCTS FROM products.json
========================================================= */

(async function loadProductsFromJson() {

  try {

    const res =
      await fetch("products.json?t=" + Date.now());

    if (!res.ok) {
      throw new Error("products.json not found");
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("products.json is not an array");
    }

    products.length = 0;

    products.push(
      ...data.filter(p => p.category === "sneakers")
    );

    populateFilterOptions();
    syncFilterControls();
    updateFilterSummary();
    renderProducts();

    // Inject Google Rich Results (Product) structured data
    injectProductSchema(products);

    if (wishlistCount) {
      wishlistCount.textContent = wishlist.length;
    }

  } catch (e) {

    console.warn(
      "Could not load products.json:",
      e.message
    );

    if (productGrid) {

      productGrid.innerHTML = `
        <div class="empty-state">
          No products loaded.
          Make sure products.json
          exists next to index.html.
        </div>
      `;

    }

  }

})();
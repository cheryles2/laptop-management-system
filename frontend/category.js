const state = {
  products: [],
  query: "",
  sortBy: "newest",
  slug: "",
  page: 1,
  pageSize: 6,
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const CART_STORAGE_KEY = "laptop_market_cart";
const API_BASE_URL = (
  window.__API_BASE_URL__ ||
  "https://laptop-management-system-oy7i.onrender.com"
).replace(/\/+$/, "");

const elements = {
  categoryTitle: document.getElementById("category-title"),
  categorySearch: document.getElementById("category-search"),
  categorySort: document.getElementById("category-sort"),
  categoryGrid: document.getElementById("category-grid"),
  categoryPrevPage: document.getElementById("category-prev-page"),
  categoryNextPage: document.getElementById("category-next-page"),
  categoryPageInfo: document.getElementById("category-page-info"),
  toast: document.getElementById("toast"),
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inferCategory(product) {
  const name = `${product.name} ${product.brand}`.toLowerCase();
  if (
    name.includes("rog") ||
    name.includes("legion") ||
    name.includes("alienware") ||
    name.includes("predator") ||
    name.includes("omen")
  ) {
    return "gaming";
  }
  if (
    name.includes("xps") ||
    name.includes("zenbook") ||
    name.includes("spectre") ||
    name.includes("gram") ||
    name.includes("surface")
  ) {
    return "creator";
  }
  return "office";
}

function toast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? "#9d2d2d" : "#1d2330";
  elements.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(
    () => elements.toast.classList.remove("show"),
    2200,
  );
}

async function request(url, options = {}) {
  const targetUrl = /^https?:\/\//i.test(url)
    ? url
    : `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;

  const response = await fetch(targetUrl, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function addToCart(product) {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  let rows = [];
  if (raw) {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = [];
    }
  }

  const index = rows.findIndex((row) => Number(row.productId) === product.id);
  if (index >= 0) {
    rows[index].quantity = Math.min(
      product.stock,
      Number(rows[index].quantity) + 1,
    );
  } else {
    rows.push({ productId: product.id, quantity: 1 });
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(rows));
  toast("Da them vao gio hang");
}

function filteredProducts() {
  const q = state.query.trim().toLowerCase();
  const rows = state.products
    .filter((product) => inferCategory(product) === state.slug)
    .filter((product) => {
      if (!q) {
        return true;
      }

      return `${product.name} ${product.brand} ${product.sku}`
        .toLowerCase()
        .includes(q);
    });

  if (state.sortBy === "price-asc") {
    return rows.sort((a, b) => a.price - b.price);
  }
  if (state.sortBy === "price-desc") {
    return rows.sort((a, b) => b.price - a.price);
  }
  return rows.sort((a, b) => b.id - a.id);
}

function pagedProducts() {
  const rows = filteredProducts();
  const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPages) {
    state.page = totalPages;
  }

  const start = (state.page - 1) * state.pageSize;
  return {
    rows: rows.slice(start, start + state.pageSize),
    totalPages,
  };
}

function renderProducts() {
  const { rows, totalPages } = pagedProducts();
  elements.categoryGrid.innerHTML =
    rows
      .map(
        (product) => `
      <article class="product-card">
        <div class="product-thumb"></div>
        <h3 class="product-name"><a class="product-link" href="/product/${slugify(product.name)}-${product.id}">${escapeHtml(product.name)}</a></h3>
        <div class="product-meta">${escapeHtml(product.brand)} | ${escapeHtml(product.sku)}</div>
        <div class="price">${escapeHtml(currency.format(product.price))}</div>
        <div class="product-bottom">
          <small>Ton kho: ${escapeHtml(product.stock)}</small>
          <button class="btn" data-id="${product.id}">Them vao gio</button>
        </div>
      </article>
    `,
      )
      .join("") ||
    '<div class="empty">Khong co san pham trong danh muc nay.</div>';

  elements.categoryPageInfo.textContent = `Trang ${state.page} / ${totalPages}`;
  elements.categoryPrevPage.disabled = state.page <= 1;
  elements.categoryNextPage.disabled = state.page >= totalPages;
}

function categoryTitle(slug) {
  if (slug === "gaming") {
    return "Danh muc Gaming";
  }
  if (slug === "creator") {
    return "Danh muc Creator";
  }
  return "Danh muc Van phong";
}

function getSlugFromPath() {
  const matches = window.location.pathname.match(/\/category\/([^/]+)/);
  if (matches) {
    return matches[1].toLowerCase();
  }

  return "office";
}

function setupEvents() {
  elements.categorySearch.addEventListener("input", () => {
    state.query = elements.categorySearch.value;
    state.page = 1;
    renderProducts();
  });

  elements.categorySort.addEventListener("change", () => {
    state.sortBy = elements.categorySort.value;
    state.page = 1;
    renderProducts();
  });

  elements.categoryPrevPage.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderProducts();
  });

  elements.categoryNextPage.addEventListener("click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredProducts().length / state.pageSize),
    );
    state.page = Math.min(totalPages, state.page + 1);
    renderProducts();
  });

  elements.categoryGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const id = Number(target.dataset.id);
    const product = state.products.find((item) => item.id === id);
    if (!product) {
      return;
    }

    addToCart(product);
  });
}

async function bootstrap() {
  state.slug = getSlugFromPath();
  elements.categoryTitle.textContent = categoryTitle(state.slug);
  setupEvents();

  try {
    state.products = await request("/api/products");
    renderProducts();
  } catch (error) {
    toast(error.message, true);
  }
}

bootstrap();

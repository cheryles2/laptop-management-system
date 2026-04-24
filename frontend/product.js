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

const detailPanel = document.getElementById("detail-panel");
const relatedGrid = document.getElementById("related-grid");
const toastEl = document.getElementById("toast");
const breadcrumbEl = document.getElementById("breadcrumb");
const commentForm = document.getElementById("comment-form");
const commentNameInput = document.getElementById("comment-name");
const commentStarsInput = document.getElementById("comment-stars");
const commentContentInput = document.getElementById("comment-content");
const commentsList = document.getElementById("comments-list");
const ratingSummary = document.getElementById("rating-summary");

let currentProduct = null;

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

function toast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.style.background = isError ? "#9d2d2d" : "#1d2330";
  toastEl.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryId = Number(params.get("id"));
  if (queryId) {
    return queryId;
  }

  const matches = window.location.pathname.match(/\/product\/(?:.*-)?(\d+)$/);
  if (matches) {
    return Number(matches[1]);
  }

  return 0;
}

function commentStorageKey(productId) {
  return `laptop_market_comments_${productId}`;
}

function readComments(productId) {
  const raw = localStorage.getItem(commentStorageKey(productId));
  if (!raw) {
    return [];
  }

  try {
    const rows = JSON.parse(raw);
    if (Array.isArray(rows)) {
      return rows;
    }
    return [];
  } catch {
    return [];
  }
}

function writeComments(productId, comments) {
  localStorage.setItem(commentStorageKey(productId), JSON.stringify(comments));
}

function addToCart(product, quantity) {
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
      Number(rows[index].quantity) + quantity,
    );
  } else {
    rows.push({
      productId: product.id,
      quantity: Math.min(product.stock, quantity),
    });
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(rows));
}

function renderNotFound() {
  detailPanel.innerHTML = '<div class="empty">Khong tim thay san pham.</div>';
}

function renderDetail(product) {
  const specs = [
    { key: "CPU", value: "Intel Core i7 / Apple M-series (mock)" },
    { key: "RAM", value: "16GB LPDDR5" },
    { key: "SSD", value: "512GB NVMe" },
    { key: "Man hinh", value: "14 inch, 2.8K" },
    { key: "Bao hanh", value: "12 thang chinh hang" },
  ];

  detailPanel.innerHTML = `
    <div class="detail-grid">
      <div class="product-thumb" style="height:280px"></div>
      <div>
        <h2>${escapeHtml(product.name)}</h2>
        <p class="product-meta">${escapeHtml(product.brand)} | ${escapeHtml(product.sku)}</p>
        <p class="price">${escapeHtml(currency.format(product.price))}</p>
        <p class="product-meta">Ton kho: ${escapeHtml(product.stock)}</p>
        <p class="product-meta">Mau laptop phu hop hoc tap, van phong, lam viec sang tao va gaming.</p>

        <div class="row-2" style="max-width: 360px">
          <input id="quantity-input" type="number" min="1" max="${product.stock}" value="1" />
          <button id="add-detail-btn" class="btn" ${product.stock > 0 ? "" : "disabled"}>Them vao gio</button>
        </div>
        <button id="buy-now-btn" class="btn" style="margin-top:0.5rem" ${product.stock > 0 ? "" : "disabled"}>Mua ngay</button>
      </div>
    </div>

    <div class="summary-box" style="margin-top: 1rem">
      ${specs
        .map(
          (item) =>
            `<div class="line"><span>${escapeHtml(item.key)}</span><strong>${escapeHtml(item.value)}</strong></div>`,
        )
        .join("")}
    </div>
  `;

  const quantityInput = document.getElementById("quantity-input");
  const addBtn = document.getElementById("add-detail-btn");
  const buyNowBtn = document.getElementById("buy-now-btn");

  addBtn.addEventListener("click", () => {
    const quantity = Math.max(1, Number(quantityInput.value || 1));
    addToCart(product, quantity);
    toast("Da them vao gio hang");
  });

  buyNowBtn.addEventListener("click", () => {
    const quantity = Math.max(1, Number(quantityInput.value || 1));
    addToCart(product, quantity);
    window.location.href = "/";
  });
}

function renderRelated(products, current) {
  const related = products
    .filter((item) => item.id !== current.id && item.brand === current.brand)
    .slice(0, 6);

  relatedGrid.innerHTML =
    related
      .map(
        (item) => `
      <article class="product-card">
        <div class="product-thumb"></div>
        <h3 class="product-name"><a class="product-link" href="/product/${item.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(
            /^-+|-+$/g,
            "",
          )}-${item.id}">${escapeHtml(item.name)}</a></h3>
        <div class="product-meta">${escapeHtml(item.brand)} | ${escapeHtml(item.sku)}</div>
        <div class="price">${escapeHtml(currency.format(item.price))}</div>
      </article>
    `,
      )
      .join("") || '<div class="empty">Chua co san pham lien quan.</div>';
}

function renderComments(product) {
  const comments = readComments(product.id);
  const allStars = comments
    .map((item) => Number(item.stars))
    .filter((n) => Number.isFinite(n));
  const avg = allStars.length
    ? allStars.reduce((sum, n) => sum + n, 0) / allStars.length
    : 0;
  const starsText = avg ? `${avg.toFixed(1)} / 5` : "Chua co";

  ratingSummary.innerHTML = `
    <div class="line"><span>Danh gia trung binh</span><strong>${escapeHtml(starsText)}</strong></div>
    <div class="line total"><span>So luot danh gia</span><strong>${escapeHtml(allStars.length)}</strong></div>
  `;

  commentsList.innerHTML =
    comments
      .map(
        (item) => `
      <article class="order-card">
        <div class="cart-item-top">
          <strong>${escapeHtml(item.name)}</strong>
          <strong>${"★".repeat(Number(item.stars))}</strong>
        </div>
        <p class="product-meta">${escapeHtml(item.content)}</p>
        <small class="product-meta">${escapeHtml(item.createdAt)}</small>
      </article>
    `,
      )
      .join("") || '<div class="empty">Chua co binh luan nao.</div>';
}

function setupCommentForm(product) {
  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = commentNameInput.value.trim();
    const stars = Number(commentStarsInput.value);
    const content = commentContentInput.value.trim();

    if (!name || !content) {
      toast("Nhap day du thong tin danh gia", true);
      return;
    }

    const comments = readComments(product.id);
    comments.unshift({
      name,
      stars,
      content,
      createdAt: new Date().toLocaleString("vi-VN"),
    });

    writeComments(product.id, comments.slice(0, 30));
    commentForm.reset();
    renderComments(product);
    toast("Da gui binh luan");
  });
}

async function bootstrap() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    renderNotFound();
    return;
  }

  try {
    const product = await request(`/api/products/${productId}`);
    const products = await request("/api/products");
    if (!product) {
      renderNotFound();
      return;
    }

    currentProduct = product;
    breadcrumbEl.textContent = `Trang chu / ${product.brand} / ${product.name}`;
    renderDetail(product);
    renderRelated(products, product);
    renderComments(product);
    setupCommentForm(product);
  } catch (error) {
    toast(error.message, true);
  }
}

bootstrap();

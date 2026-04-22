const state = {
  products: [],
  cart: [],
  query: "",
  sortBy: "newest",
  shippingFee: 0,
  selectedBrands: [],
  page: 1,
  pageSize: 6,
};

const CART_STORAGE_KEY = "laptop_market_cart";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const elements = {
  productsGrid: document.getElementById("products-grid"),
  cartList: document.getElementById("cart-list"),
  searchInput: document.getElementById("search-input"),
  sortSelect: document.getElementById("sort-select"),
  brandFilters: document.getElementById("brand-filters"),
  clearBrandBtn: document.getElementById("clear-brand-btn"),
  seedBtn: document.getElementById("seed-btn"),
  cartCount: document.getElementById("cart-count"),
  subtotal: document.getElementById("subtotal"),
  shippingFee: document.getElementById("shipping-fee"),
  grandTotal: document.getElementById("grand-total"),
  checkoutForm: document.getElementById("checkout-form"),
  customerName: document.getElementById("customer-name"),
  customerPhone: document.getElementById("customer-phone"),
  customerAddress: document.getElementById("customer-address"),
  orderNotes: document.getElementById("order-notes"),
  paymentMethod: document.getElementById("payment-method"),
  shippingProvider: document.getElementById("shipping-provider"),
  calcShipBtn: document.getElementById("calc-ship-btn"),
  prevPageBtn: document.getElementById("prev-page"),
  nextPageBtn: document.getElementById("next-page"),
  pageInfo: document.getElementById("page-info"),
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

async function request(url, options = {}) {
  const response = await fetch(url, {
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
  elements.toast.textContent = message;
  elements.toast.style.background = isError ? "#9d2d2d" : "#1d2330";
  elements.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  const list = state.products.filter((p) => {
    const hitBrand =
      state.selectedBrands.length === 0 ||
      state.selectedBrands.includes(p.brand.toLowerCase());
    if (!hitBrand) {
      return false;
    }

    if (!query) {
      return true;
    }
    return `${p.sku} ${p.name} ${p.brand}`.toLowerCase().includes(query);
  });

  if (state.sortBy === "price-asc") {
    return list.sort((a, b) => a.price - b.price);
  }
  if (state.sortBy === "price-desc") {
    return list.sort((a, b) => b.price - a.price);
  }
  if (state.sortBy === "stock-desc") {
    return list.sort((a, b) => b.stock - a.stock);
  }

  return list.sort((a, b) => b.id - a.id);
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
    totalRows: rows.length,
  };
}

function cartItemByProductId(productId) {
  return state.cart.find((item) => item.product.id === productId);
}

function saveCart() {
  const payload = state.cart.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
  }));
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
}

function loadCartFromStorage() {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const payload = JSON.parse(raw);
    const restored = [];

    for (const row of payload) {
      const product = state.products.find(
        (item) => item.id === Number(row.productId),
      );
      const quantity = Number(row.quantity);
      if (!product || !quantity || quantity <= 0) {
        continue;
      }

      restored.push({
        product,
        quantity: Math.min(quantity, product.stock),
      });
    }

    state.cart = restored;
  } catch {
    state.cart = [];
  }
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  const existing = cartItemByProductId(productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      toast("Vuot qua ton kho", true);
      return;
    }
    existing.quantity += 1;
  } else {
    state.cart.push({ product, quantity: 1 });
  }

  renderCart();
  renderProducts();
  saveCart();
}

function increaseItem(productId) {
  const item = cartItemByProductId(productId);
  if (!item) {
    return;
  }
  if (item.quantity >= item.product.stock) {
    toast("Vuot qua ton kho", true);
    return;
  }
  item.quantity += 1;
  renderCart();
  renderProducts();
  saveCart();
}

function decreaseItem(productId) {
  const item = cartItemByProductId(productId);
  if (!item) {
    return;
  }
  item.quantity -= 1;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((x) => x.product.id !== productId);
  }
  renderCart();
  renderProducts();
  saveCart();
}

function removeItem(productId) {
  state.cart = state.cart.filter((item) => item.product.id !== productId);
  renderCart();
  renderProducts();
  saveCart();
}

function renderBrandFilters() {
  const brands = [...new Set(state.products.map((p) => p.brand))].sort((a, b) =>
    a.localeCompare(b, "vi"),
  );

  elements.brandFilters.innerHTML =
    brands
      .map((brand) => {
        const value = brand.toLowerCase();
        const checked = state.selectedBrands.includes(value) ? "checked" : "";
        return `<label class="brand-item"><input type="checkbox" data-brand="${escapeHtml(value)}" ${checked} /> ${escapeHtml(brand)}</label>`;
      })
      .join("") || '<div class="empty">Chua co thuong hieu.</div>';
}

function cartSubtotal() {
  return state.cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
}

function cartTotalQuantity() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderProducts() {
  const { rows, totalPages } = pagedProducts();
  elements.productsGrid.innerHTML =
    rows
      .map((p) => {
        const inCart = cartItemByProductId(p.id);
        const canAdd = p.stock > 0 && (!inCart || inCart.quantity < p.stock);
        return `
          <article class="product-card">
            <div class="product-thumb"></div>
            <h3 class="product-name"><a class="product-link" href="/product/${slugify(p.name)}-${p.id}">${escapeHtml(p.name)}</a></h3>
            <div class="product-meta">${escapeHtml(p.brand)} | ${escapeHtml(p.sku)}</div>
            <div class="price">${escapeHtml(currency.format(p.price))}</div>
            <div class="product-bottom">
              <small>Ton kho: ${escapeHtml(p.stock)}</small>
              <button class="btn" data-action="add" data-id="${p.id}" ${canAdd ? "" : "disabled"}>Them vao gio</button>
            </div>
          </article>
        `;
      })
      .join("") || '<div class="empty">Khong tim thay san pham.</div>';

  elements.pageInfo.textContent = `Trang ${state.page} / ${totalPages}`;
  elements.prevPageBtn.disabled = state.page <= 1;
  elements.nextPageBtn.disabled = state.page >= totalPages;
}

function renderCart() {
  elements.cartCount.textContent = cartTotalQuantity();

  const subtotal = cartSubtotal();
  const total = subtotal + state.shippingFee;

  elements.subtotal.textContent = currency.format(subtotal);
  elements.shippingFee.textContent = currency.format(state.shippingFee);
  elements.grandTotal.textContent = currency.format(total);

  elements.cartList.innerHTML =
    state.cart
      .map(
        (item) => `
      <article class="cart-item">
        <div class="cart-item-top">
          <strong>${escapeHtml(item.product.name)}</strong>
          <strong>${escapeHtml(currency.format(item.product.price * item.quantity))}</strong>
        </div>
        <small>${escapeHtml(item.product.sku)} | ${escapeHtml(currency.format(item.product.price))}</small>
        <div class="cart-actions">
          <button class="qty-btn" data-action="minus" data-id="${item.product.id}">-</button>
          <span>${escapeHtml(item.quantity)}</span>
          <button class="qty-btn" data-action="plus" data-id="${item.product.id}">+</button>
          <button class="remove-btn" data-action="remove" data-id="${item.product.id}">Xoa</button>
        </div>
      </article>
    `,
      )
      .join("") || '<div class="empty">Gio hang dang trong.</div>';
}

async function loadProducts() {
  state.products = await request("/api/products");
  loadCartFromStorage();
  renderBrandFilters();
  renderProducts();
  renderCart();
}

function cartItemsPayload() {
  return state.cart.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
  }));
}

async function calculateShippingFee() {
  if (state.cart.length === 0) {
    toast("Gio hang dang trong", true);
    return;
  }

  const provider = elements.shippingProvider.value;
  const endpoint =
    provider === "ghn" ? "/api/shipping/ghn/fee" : "/api/shipping/ghtk/fee";

  try {
    const response = await request(endpoint, {
      method: "POST",
      body: JSON.stringify({
        weight: Math.max(800, cartTotalQuantity() * 900),
        address: elements.customerAddress.value.trim() || "Dia chi mac dinh",
        district: "Quan 7",
        province: "Ho Chi Minh",
        value: cartSubtotal(),
      }),
    });

    state.shippingFee = Number(response.fee) || 0;
    renderCart();
    toast(`Da tinh ship (${response.mode})`);
  } catch (error) {
    toast(error.message, true);
  }
}

async function checkout() {
  if (state.cart.length === 0) {
    toast("Gio hang dang trong", true);
    return;
  }

  const payload = {
    customerName: elements.customerName.value.trim(),
    customerPhone: elements.customerPhone.value.trim(),
    address: elements.customerAddress.value.trim(),
    notes: elements.orderNotes.value.trim(),
    paymentMethod: elements.paymentMethod.value,
    shippingProvider: elements.shippingProvider.value,
    shippingFee: state.shippingFee,
    items: cartItemsPayload(),
  };

  if (!payload.customerName) {
    toast("Nhap ten khach hang", true);
    return;
  }

  try {
    const order = await request("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (payload.paymentMethod === "vnpay" || payload.paymentMethod === "momo") {
      const paymentEndpoint =
        payload.paymentMethod === "vnpay"
          ? "/api/payments/vnpay/create-url"
          : "/api/payments/momo/create-url";

      const payment = await request(paymentEndpoint, {
        method: "POST",
        body: JSON.stringify({
          amount: order.total_amount,
          orderId: `ORD-${order.id}`,
        }),
      });

      state.cart = [];
      state.shippingFee = 0;
      saveCart();
      window.location.href = payment.paymentUrl;
      return;
    }

    state.cart = [];
    state.shippingFee = 0;
    saveCart();
    elements.checkoutForm.reset();
    renderCart();
    await loadProducts();
    toast("Dat hang thanh cong");
  } catch (error) {
    toast(error.message, true);
  }
}

function setupEvents() {
  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    state.page = 1;
    renderProducts();
  });

  elements.sortSelect.addEventListener("change", () => {
    state.sortBy = elements.sortSelect.value;
    state.page = 1;
    renderProducts();
  });

  elements.brandFilters.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (!target.dataset.brand) {
      return;
    }

    if (target.checked) {
      state.selectedBrands.push(target.dataset.brand);
    } else {
      state.selectedBrands = state.selectedBrands.filter(
        (item) => item !== target.dataset.brand,
      );
    }

    state.page = 1;
    renderProducts();
  });

  elements.clearBrandBtn.addEventListener("click", () => {
    state.selectedBrands = [];
    state.page = 1;
    renderBrandFilters();
    renderProducts();
  });

  elements.prevPageBtn.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderProducts();
  });

  elements.nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredProducts().length / state.pageSize),
    );
    state.page = Math.min(totalPages, state.page + 1);
    renderProducts();
  });

  elements.seedBtn.addEventListener("click", async () => {
    try {
      const response = await request("/api/products/seed-mock", {
        method: "POST",
      });
      await loadProducts();
      toast(`Da them ${response.insertedCount} san pham mock`);
    } catch (error) {
      toast(error.message, true);
    }
  });

  elements.productsGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    if (target.dataset.action !== "add") {
      return;
    }

    addToCart(Number(target.dataset.id));
  });

  elements.cartList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const action = target.dataset.action;
    const productId = Number(target.dataset.id);

    if (action === "plus") {
      increaseItem(productId);
      return;
    }
    if (action === "minus") {
      decreaseItem(productId);
      return;
    }
    if (action === "remove") {
      removeItem(productId);
    }
  });

  elements.calcShipBtn.addEventListener("click", calculateShippingFee);

  elements.checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    checkout();
  });
}

async function bootstrap() {
  setupEvents();
  try {
    await loadProducts();
  } catch (error) {
    toast(error.message, true);
  }
}

bootstrap();

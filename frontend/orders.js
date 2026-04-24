const state = {
  orders: [],
  query: "",
  sortBy: "newest",
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const API_BASE_URL = (
  window.__API_BASE_URL__ ||
  "https://laptop-management-system-oy7i.onrender.com"
).replace(/\/+$/, "");

const elements = {
  orderSearch: document.getElementById("order-search"),
  orderSort: document.getElementById("order-sort"),
  ordersContainer: document.getElementById("orders-container"),
  toast: document.getElementById("toast"),
};

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

function filteredOrders() {
  const query = state.query.trim().toLowerCase();
  const orders = state.orders.filter((order) => {
    if (!query) {
      return true;
    }

    return `${order.customer_name || ""} ${order.customer_phone || ""}`
      .toLowerCase()
      .includes(query);
  });

  if (state.sortBy === "highest") {
    return orders.sort((a, b) => b.total_amount - a.total_amount);
  }

  if (state.sortBy === "lowest") {
    return orders.sort((a, b) => a.total_amount - b.total_amount);
  }

  return orders.sort((a, b) => b.id - a.id);
}

function renderOrders() {
  const rows = filteredOrders();
  elements.ordersContainer.innerHTML =
    rows
      .map((order) => {
        const items = (order.items || [])
          .map(
            (item) =>
              `<li>${escapeHtml(item.product_name)} x ${escapeHtml(item.quantity)} = ${escapeHtml(currency.format(item.line_total))}</li>`,
          )
          .join("");

        return `
          <article class="order-card">
            <div class="cart-item-top">
              <h3>Don #${escapeHtml(order.id)} - ${escapeHtml(order.customer_name)}</h3>
              <strong>${escapeHtml(currency.format(order.total_amount))}</strong>
            </div>
            <p class="product-meta">
              SDT: ${escapeHtml(order.customer_phone || "-")} | Thanh toan: ${escapeHtml(order.payment_method || "cash")} |
              Van chuyen: ${escapeHtml(order.shipping_provider || "-")}
            </p>
            <p class="product-meta">Dia chi: ${escapeHtml(order.shipping_address || "-")}</p>
            <ul class="product-meta">${items}</ul>
          </article>
        `;
      })
      .join("") || '<div class="empty">Khong co don hang nao.</div>';
}

async function loadOrders() {
  state.orders = await request("/api/orders");
  renderOrders();
}

function setupEvents() {
  elements.orderSearch.addEventListener("input", () => {
    state.query = elements.orderSearch.value;
    renderOrders();
  });

  elements.orderSort.addEventListener("change", () => {
    state.sortBy = elements.orderSort.value;
    renderOrders();
  });
}

async function bootstrap() {
  setupEvents();
  try {
    await loadOrders();
  } catch (error) {
    toast(error.message, true);
  }
}

bootstrap();

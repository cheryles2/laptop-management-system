const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

function getFrontendUrl(req) {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  return `${req.protocol}://${req.get("host")}`;
}

function getBackendUrl(req) {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  return `${req.protocol}://${req.get("host")}`;
}

function getGoogleCallbackUrl(req) {
  return (
    process.env.GOOGLE_CALLBACK_URL ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${getBackendUrl(req)}/api/auth/google/callback`
  );
}

const dataFile = path.join(__dirname, "data", "store.json");
const frontendDir = path.join(__dirname, "..", "frontend");

const nowIso = new Date().toISOString();
const mockProducts = [
  {
    sku: "LTP-001",
    name: "MacBook Air M3 13",
    brand: "Apple",
    price: 32990000,
    stock: 7,
  },
  {
    sku: "LTP-002",
    name: "ThinkPad X1 Carbon Gen 12",
    brand: "Lenovo",
    price: 41990000,
    stock: 5,
  },
  {
    sku: "LTP-003",
    name: "Dell XPS 14",
    brand: "Dell",
    price: 38990000,
    stock: 6,
  },
  {
    sku: "LTP-004",
    name: "ROG Zephyrus G14",
    brand: "ASUS",
    price: 42990000,
    stock: 4,
  },
  {
    sku: "LTP-005",
    name: "HP Spectre x360",
    brand: "HP",
    price: 35990000,
    stock: 8,
  },
  {
    sku: "LTP-006",
    name: "Acer Swift X 14",
    brand: "Acer",
    price: 27990000,
    stock: 9,
  },
  {
    sku: "LTP-007",
    name: "MSI Prestige 16 AI",
    brand: "MSI",
    price: 36990000,
    stock: 5,
  },
  {
    sku: "LTP-008",
    name: "LG Gram 16 OLED",
    brand: "LG",
    price: 40990000,
    stock: 4,
  },
  {
    sku: "LTP-009",
    name: "Surface Laptop 6",
    brand: "Microsoft",
    price: 43990000,
    stock: 3,
  },
  {
    sku: "LTP-010",
    name: "Lenovo Legion Slim 5",
    brand: "Lenovo",
    price: 33990000,
    stock: 7,
  },
  {
    sku: "LTP-011",
    name: "Dell Alienware m16 R2",
    brand: "Dell",
    price: 52990000,
    stock: 2,
  },
  {
    sku: "LTP-012",
    name: "ASUS Zenbook S 13 OLED",
    brand: "ASUS",
    price: 29990000,
    stock: 10,
  },
  {
    sku: "LTP-013",
    name: "HP Omen Transcend 14",
    brand: "HP",
    price: 37990000,
    stock: 5,
  },
  {
    sku: "LTP-014",
    name: "Acer Predator Helios Neo 16",
    brand: "Acer",
    price: 34990000,
    stock: 6,
  },
  {
    sku: "LTP-015",
    name: "MacBook Pro M4 14",
    brand: "Apple",
    price: 51990000,
    stock: 4,
  },
];

function createProductFromMock(id, product) {
  return {
    id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    price: product.price,
    stock: product.stock,
    created_at: nowIso,
  };
}

function seedMissingMockProducts(store) {
  const existingSku = new Set(
    store.products.map((item) => item.sku.toLowerCase()),
  );
  let insertedCount = 0;

  for (const item of mockProducts) {
    if (existingSku.has(item.sku.toLowerCase())) {
      continue;
    }

    store.products.push(createProductFromMock(store.nextProductId, item));
    store.nextProductId += 1;
    insertedCount += 1;
  }

  return insertedCount;
}

const initialStore = {
  nextProductId: mockProducts.length + 1,
  nextOrderId: 1,
  nextOrderItemId: 1,
  products: mockProducts.map((item, index) =>
    createProductFromMock(index + 1, item),
  ),
  orders: [],
  orderItems: [],
};

if (!fs.existsSync(path.dirname(dataFile))) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
}
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify(initialStore, null, 2));
} else {
  const store = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  const insertedCount = seedMissingMockProducts(store);
  if (insertedCount > 0) {
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
  }
}

function readStore() {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function writeStore(store) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function buildQuery(obj) {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join("&");
}

function randomTxnRef(length = 10) {
  let out = "";
  const chars = "0123456789";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function formatVnPayDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}${s}`;
}

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

app.get("/api/integrations/status", (req, res) => {
  res.json({
    payments: {
      vnpay: Boolean(
        process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET,
      ),
      momo: Boolean(
        process.env.MOMO_PARTNER_CODE &&
        process.env.MOMO_ACCESS_KEY &&
        process.env.MOMO_SECRET_KEY,
      ),
    },
    shipping: {
      ghn: Boolean(process.env.GHN_TOKEN && process.env.GHN_SHOP_ID),
      ghtk: Boolean(process.env.GHTK_TOKEN),
    },
    socialLogin: {
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      ),
      facebook: Boolean(
        process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
      ),
    },
  });
});

app.get("/api/products", (req, res) => {
  const store = readStore();
  res.json([...store.products].sort((a, b) => b.id - a.id));
});

app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "invalid product id" });
  }

  const store = readStore();
  const product = store.products.find((item) => item.id === id);
  if (!product) {
    return res.status(404).json({ message: "product not found" });
  }

  return res.json(product);
});

app.post("/api/products/seed-mock", (req, res) => {
  const store = readStore();
  const insertedCount = seedMissingMockProducts(store);
  if (insertedCount > 0) {
    writeStore(store);
  }

  return res.json({ insertedCount, totalProducts: store.products.length });
});

app.post("/api/products", (req, res) => {
  const { sku, name, brand, price, stock } = req.body;
  if (!sku || !name || !brand) {
    return res
      .status(400)
      .json({ message: "sku, name and brand are required" });
  }

  const store = readStore();
  const duplicatedSku = store.products.some(
    (item) => item.sku.toLowerCase() === String(sku).trim().toLowerCase(),
  );
  if (duplicatedSku) {
    return res.status(409).json({ message: "sku already exists" });
  }

  const numericPrice = toNumber(price);
  const numericStock = toNumber(stock);
  if (numericPrice < 0 || numericStock < 0) {
    return res.status(400).json({ message: "price and stock must be >= 0" });
  }

  const product = {
    id: store.nextProductId,
    sku: String(sku).trim(),
    name: String(name).trim(),
    brand: String(brand).trim(),
    price: numericPrice,
    stock: numericStock,
    created_at: new Date().toISOString(),
  };

  store.nextProductId += 1;
  store.products.push(product);
  writeStore(store);
  return res.status(201).json(product);
});

app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const { sku, name, brand, price, stock } = req.body;

  if (!id || !sku || !name || !brand) {
    return res
      .status(400)
      .json({ message: "id, sku, name and brand are required" });
  }

  const store = readStore();
  const index = store.products.findIndex((item) => item.id === id);
  if (index < 0) {
    return res.status(404).json({ message: "product not found" });
  }

  const duplicatedSku = store.products.some(
    (item) =>
      item.id !== id &&
      item.sku.toLowerCase() === String(sku).trim().toLowerCase(),
  );
  if (duplicatedSku) {
    return res.status(409).json({ message: "sku already exists" });
  }

  const numericPrice = toNumber(price);
  const numericStock = toNumber(stock);
  if (numericPrice < 0 || numericStock < 0) {
    return res.status(400).json({ message: "price and stock must be >= 0" });
  }

  store.products[index] = {
    ...store.products[index],
    sku: String(sku).trim(),
    name: String(name).trim(),
    brand: String(brand).trim(),
    price: numericPrice,
    stock: numericStock,
  };

  writeStore(store);
  return res.json(store.products[index]);
});

app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "invalid product id" });
  }

  const store = readStore();
  if (store.orderItems.some((item) => item.product_id === id)) {
    return res
      .status(409)
      .json({ message: "cannot delete product used in orders" });
  }

  const before = store.products.length;
  store.products = store.products.filter((item) => item.id !== id);
  if (before === store.products.length) {
    return res.status(404).json({ message: "product not found" });
  }

  writeStore(store);
  return res.json({ message: "product deleted" });
});

app.get("/api/orders", (req, res) => {
  const store = readStore();
  const orders = [...store.orders]
    .sort((a, b) => b.id - a.id)
    .map((order) => {
      const items = store.orderItems
        .filter((item) => item.order_id === order.id)
        .map((item) => {
          const product = store.products.find((p) => p.id === item.product_id);
          return {
            ...item,
            product_name: product ? product.name : "Unknown",
            product_sku: product ? product.sku : "N/A",
          };
        });
      return { ...order, items };
    });

  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const {
    customerName,
    customerPhone,
    notes,
    items,
    paymentMethod,
    shippingProvider,
    shippingFee,
    address,
  } = req.body;
  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "customerName and at least one item are required" });
  }

  const store = readStore();
  const normalizedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "invalid item payload" });
    }

    const product = store.products.find((p) => p.id === productId);
    if (!product) {
      return res
        .status(400)
        .json({ message: `product ${productId} not found` });
    }
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ message: `insufficient stock for product ${productId}` });
    }

    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    normalizedItems.push({ product, quantity, lineTotal });
  }

  const fee = Math.max(0, toNumber(shippingFee));
  const order = {
    id: store.nextOrderId,
    customer_name: String(customerName).trim(),
    customer_phone: customerPhone ? String(customerPhone).trim() : null,
    notes: notes ? String(notes).trim() : null,
    payment_method: paymentMethod || "cash",
    payment_status: "pending",
    shipping_provider: shippingProvider || null,
    shipping_fee: fee,
    shipping_address: address ? String(address).trim() : null,
    subtotal_amount: subtotal,
    total_amount: subtotal + fee,
    created_at: new Date().toISOString(),
  };

  store.nextOrderId += 1;
  store.orders.push(order);

  for (const item of normalizedItems) {
    const orderItem = {
      id: store.nextOrderItemId,
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      line_total: item.lineTotal,
    };

    store.nextOrderItemId += 1;
    store.orderItems.push(orderItem);
    item.product.stock -= item.quantity;
  }

  writeStore(store);

  const responseItems = store.orderItems
    .filter((item) => item.order_id === order.id)
    .map((item) => {
      const product = store.products.find((p) => p.id === item.product_id);
      return {
        ...item,
        product_name: product ? product.name : "Unknown",
        product_sku: product ? product.sku : "N/A",
      };
    });

  return res.status(201).json({ ...order, items: responseItems });
});

app.get("/api/dashboard", (req, res) => {
  const store = readStore();
  const totalProducts = store.products.length;
  const totalStock = store.products.reduce((sum, item) => sum + item.stock, 0);
  const totalOrders = store.orders.length;
  const revenue = store.orders.reduce(
    (sum, item) => sum + item.total_amount,
    0,
  );

  const lowStock = [...store.products]
    .filter((item) => item.stock <= 5)
    .sort((a, b) => a.stock - b.stock || b.id - a.id)
    .slice(0, 5);

  res.json({ totalProducts, totalStock, totalOrders, revenue, lowStock });
});

app.post("/api/payments/vnpay/create-url", (req, res) => {
  const amount = Math.max(0, toNumber(req.body.amount));
  const orderId = req.body.orderId || randomTxnRef(8);
  const frontendUrl = getFrontendUrl(req);

  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secret = process.env.VNPAY_HASH_SECRET;
  const paymentBase =
    process.env.VNPAY_URL ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl =
    process.env.VNPAY_RETURN_URL || `${frontendUrl}/payment-return`;

  if (!tmnCode || !secret) {
    return res.json({
      provider: "vnpay",
      mode: "mock",
      paymentUrl: `${frontendUrl}/payment-return?provider=vnpay&status=success&orderId=${orderId}`,
      orderId,
    });
  }

  const params = sortObject({
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(Math.round(amount * 100)),
    vnp_CurrCode: "VND",
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: req.ip || "127.0.0.1",
    vnp_CreateDate: formatVnPayDate(),
  });

  const signData = buildQuery(params);
  const hash = crypto
    .createHmac("sha512", secret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
  const paymentUrl = `${paymentBase}?${signData}&vnp_SecureHash=${hash}`;

  res.json({ provider: "vnpay", mode: "live", paymentUrl, orderId });
});

app.post("/api/payments/momo/create-url", async (req, res) => {
  const amount = Math.max(0, toNumber(req.body.amount));
  const orderId = String(req.body.orderId || randomTxnRef(10));
  const frontendUrl = getFrontendUrl(req);

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl =
    process.env.MOMO_REDIRECT_URL || `${frontendUrl}/payment-return`;
  const ipnUrl =
    process.env.MOMO_IPN_URL || `${frontendUrl}/api/payments/momo/ipn`;
  const endpoint =
    process.env.MOMO_CREATE_URL ||
    "https://test-payment.momo.vn/v2/gateway/api/create";

  if (!partnerCode || !accessKey || !secretKey) {
    return res.json({
      provider: "momo",
      mode: "mock",
      paymentUrl: `${frontendUrl}/payment-return?provider=momo&status=success&orderId=${orderId}`,
      orderId,
    });
  }

  const requestId = `${orderId}-${Date.now()}`;
  const rawSignature =
    `accessKey=${accessKey}&amount=${Math.round(amount)}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}` +
    `&orderInfo=Thanh toan don hang ${orderId}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}&requestType=captureWallet`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const payload = {
    partnerCode,
    requestId,
    amount: String(Math.round(amount)),
    orderId,
    orderInfo: `Thanh toan don hang ${orderId}`,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType: "captureWallet",
    autoCapture: true,
    extraData: "",
    signature,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.payUrl) {
      return res
        .status(400)
        .json({ message: data.message || "momo create payment failed" });
    }

    return res.json({
      provider: "momo",
      mode: "live",
      paymentUrl: data.payUrl,
      orderId,
      raw: data,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: error.message || "momo request failed" });
  }
});

app.post("/api/shipping/ghn/fee", async (req, res) => {
  const weight = Math.max(100, toNumber(req.body.weight, 1000));
  const token = process.env.GHN_TOKEN;
  const shopId = process.env.GHN_SHOP_ID;

  if (!token || !shopId) {
    const fee = 18000 + Math.round(weight / 1000) * 7000;
    return res.json({
      provider: "ghn",
      mode: "mock",
      fee,
      currency: "VND",
      expectedDays: "2-4",
    });
  }

  const payload = {
    from_district_id: toNumber(process.env.GHN_FROM_DISTRICT_ID, 1454),
    service_id: toNumber(process.env.GHN_SERVICE_ID, 53320),
    to_district_id: toNumber(req.body.toDistrictId, 1452),
    to_ward_code: String(req.body.toWardCode || "21211"),
    weight,
  };

  try {
    const response = await fetch(
      "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Token: token,
          ShopId: String(shopId),
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();

    if (!response.ok || !data.data) {
      return res
        .status(400)
        .json({ message: data.message || "ghn calculate fee failed" });
    }

    return res.json({
      provider: "ghn",
      mode: "live",
      fee: data.data.total,
      currency: "VND",
      raw: data,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: error.message || "ghn request failed" });
  }
});

app.post("/api/shipping/ghtk/fee", async (req, res) => {
  const weight = Math.max(100, toNumber(req.body.weight, 1000));
  const token = process.env.GHTK_TOKEN;

  if (!token) {
    const fee = 15000 + Math.round(weight / 1000) * 8000;
    return res.json({
      provider: "ghtk",
      mode: "mock",
      fee,
      currency: "VND",
      expectedDays: "2-5",
    });
  }

  const params = new URLSearchParams({
    pick_province: process.env.GHTK_PICK_PROVINCE || "Ho Chi Minh",
    pick_district: process.env.GHTK_PICK_DISTRICT || "Quan 1",
    province: req.body.province || "Ho Chi Minh",
    district: req.body.district || "Quan 7",
    address: req.body.address || "Khu do thi",
    weight: String(weight),
    value: String(Math.max(0, toNumber(req.body.value, 1000000))),
    transport: req.body.transport || "road",
  });

  try {
    const response = await fetch(
      `https://services.giaohangtietkiem.vn/services/shipment/fee?${params.toString()}`,
      {
        headers: { Token: token },
      },
    );
    const data = await response.json();

    if (!response.ok || !data.fee) {
      return res
        .status(400)
        .json({ message: data.message || "ghtk calculate fee failed" });
    }

    return res.json({
      provider: "ghtk",
      mode: "live",
      fee: data.fee.fee,
      currency: "VND",
      raw: data,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: error.message || "ghtk request failed" });
  }
});

app.get("/api/auth/google/url", (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getGoogleCallbackUrl(req);
  const startUrl = process.env.GOOGLE_OAUTH_START_URL;

  if (startUrl) {
    return res.json({
      provider: "google",
      mode: "live",
      loginUrl: startUrl,
    });
  }

  if (!clientId) {
    return res.json({
      provider: "google",
      mode: "mock",
      loginUrl: `${frontendUrl}/?mockLogin=google&name=Demo+Google+User&email=google.demo@example.com`,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return res.json({
    provider: "google",
    mode: "live",
    loginUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getGoogleCallbackUrl(req);

  if (!clientId || !clientSecret || !code) {
    return res.json({
      provider: "google",
      mode: "mock",
      user: { name: "Demo Google User", email: "google.demo@example.com" },
    });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).json({
        message: tokenData.error_description || "google token exchange failed",
      });
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const profile = await profileRes.json();
    return res.json({ provider: "google", mode: "live", user: profile });
  } catch (error) {
    return res
      .status(400)
      .json({ message: error.message || "google auth failed" });
  }
});

app.get("/api/auth/facebook/url", (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    `${frontendUrl}/api/auth/facebook/callback`;

  if (!clientId) {
    return res.json({
      provider: "facebook",
      mode: "mock",
      loginUrl: `${frontendUrl}/?mockLogin=facebook&name=Demo+Facebook+User&email=facebook.demo@example.com`,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "public_profile,email",
    response_type: "code",
  });

  return res.json({
    provider: "facebook",
    mode: "live",
    loginUrl: `https://www.facebook.com/v19.0/dialog/oauth?${params}`,
  });
});

app.get("/api/auth/facebook/callback", async (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  const code = req.query.code;
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    `${frontendUrl}/api/auth/facebook/callback`;

  if (!clientId || !clientSecret || !code) {
    return res.json({
      provider: "facebook",
      mode: "mock",
      user: { name: "Demo Facebook User", email: "facebook.demo@example.com" },
    });
  }

  try {
    const tokenUrl = new URL(
      "https://graph.facebook.com/v19.0/oauth/access_token",
    );
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", String(code));

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).json({
        message: tokenData.error?.message || "facebook token exchange failed",
      });
    }

    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.searchParams.set("fields", "id,name,email");
    profileUrl.searchParams.set("access_token", tokenData.access_token);

    const profileRes = await fetch(profileUrl);
    const profile = await profileRes.json();
    return res.json({ provider: "facebook", mode: "live", user: profile });
  } catch (error) {
    return res
      .status(400)
      .json({ message: error.message || "facebook auth failed" });
  }
});

app.get("/payment-return", (req, res) => {
  const returnPath = path.join(frontendDir, "payment-return.html");
  if (fs.existsSync(returnPath)) {
    return res.sendFile(returnPath);
  }

  return res.status(404).send("Payment return page not found");
});

function sendFrontendPage(res, fileName, notFoundMessage) {
  const filePath = path.join(frontendDir, fileName);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  return res.status(404).send(notFoundMessage);
}

app.get("/", (req, res) =>
  sendFrontendPage(res, "index.html", "Homepage not found"),
);
app.get("/orders", (req, res) =>
  sendFrontendPage(res, "orders.html", "Orders page not found"),
);
app.get("/about", (req, res) =>
  sendFrontendPage(res, "about.html", "About page not found"),
);
app.get("/product/:id", (req, res) =>
  sendFrontendPage(res, "product.html", "Product page not found"),
);
app.get("/category/:slug", (req, res) =>
  sendFrontendPage(res, "category.html", "Category page not found"),
);

app.get("*", (req, res) => {
  const indexPath = path.join(frontendDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).send("Frontend not found");
});

function startServer(preferredPort) {
  const port = Number(preferredPort) || 3000;
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy, retrying on ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    throw error;
  });
}

startServer(PORT);

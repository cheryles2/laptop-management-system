const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSQL_URL;

let dbPool;

function getFrontendUrl(req) {
  if (req && typeof req.get === "function") {
    const origin = req.get("origin") || req.get("referer");
    if (origin) {
      try {
        return new URL(origin).origin;
      } catch {
        // fall through to env / request host
      }
    }
  }

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

function parseDatabaseUrl(connectionString) {
  const url = new URL(connectionString);
  const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    decimalNumbers: true,
    timezone: "Z",
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  };
}

function getDb() {
  if (!DATABASE_URL) {
    throw Object.assign(new Error("DATABASE_URL is missing"), { status: 500 });
  }

  if (!dbPool) {
    dbPool = mysql.createPool(parseDatabaseUrl(DATABASE_URL));
  }

  return dbPool;
}

async function query(sql, params = []) {
  const [rows] = await getDb().query(sql, params);
  return rows;
}

async function withTransaction(callback) {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function toIsoDate(value) {
  if (!value) {
    return value;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} /.test(value)) {
    const utcDate = new Date(value.replace(" ", "T") + "Z");
    return Number.isNaN(utcDate.getTime()) ? value : utcDate.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function mapProductRow(row) {
  return {
    id: Number(row.id),
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    price: Number(row.price),
    stock: Number(row.stock),
    created_at: toIsoDate(row.created_at),
  };
}

function mapOrderRow(row) {
  return {
    id: Number(row.id),
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    notes: row.notes,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    shipping_provider: row.shipping_provider,
    shipping_fee: Number(row.shipping_fee),
    shipping_address: row.shipping_address,
    subtotal_amount: Number(row.subtotal_amount),
    total_amount: Number(row.total_amount),
    created_at: toIsoDate(row.created_at),
  };
}

function mapOrderItemRow(row) {
  return {
    id: Number(row.id),
    order_id: Number(row.order_id),
    product_id: Number(row.product_id),
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    line_total: Number(row.line_total),
    product_name: row.product_name || "Unknown",
    product_sku: row.product_sku || "N/A",
  };
}

async function seedMissingMockProducts(connection = getDb()) {
  const rows = await connection.query("SELECT sku FROM products");
  const existingSku = new Set(
    rows[0].map((item) => String(item.sku).toLowerCase()),
  );
  const missingProducts = mockProducts.filter(
    (item) => !existingSku.has(item.sku.toLowerCase()),
  );

  if (missingProducts.length === 0) {
    return 0;
  }

  const values = missingProducts.map((item) => [
    item.sku,
    item.name,
    item.brand,
    item.price,
    item.stock,
    nowIso,
  ]);

  await connection.query(
    "INSERT INTO products (sku, name, brand, price, stock, created_at) VALUES ?",
    [values],
  );

  return missingProducts.length;
}

async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(120) NOT NULL,
      price BIGINT NOT NULL,
      stock INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      notes TEXT,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      shipping_provider VARCHAR(50),
      shipping_fee BIGINT NOT NULL DEFAULT 0,
      shipping_address TEXT,
      subtotal_amount BIGINT NOT NULL,
      total_amount BIGINT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price BIGINT NOT NULL,
      line_total BIGINT NOT NULL,
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const countRows = await query("SELECT COUNT(*) AS total FROM products");
  if (Number(countRows[0].total) === 0) {
    await seedMissingMockProducts();
  }
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

function getAuthRedirectUrl(req, provider, user) {
  const frontendUrl = getFrontendUrl(req);
  const url = new URL(frontendUrl);
  url.searchParams.set("authProvider", provider);
  url.searchParams.set("authMode", "success");
  if (user?.name) {
    url.searchParams.set("authName", user.name);
  }
  if (user?.email) {
    url.searchParams.set("authEmail", user.email);
  }

  return url.toString();
}

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

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

app.get(
  "/api/products",
  asyncHandler(async (req, res) => {
    const rows = await query("SELECT * FROM products ORDER BY id DESC");
    res.json(rows.map(mapProductRow));
  }),
);

app.get(
  "/api/products/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "invalid product id" });
    }

    const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "product not found" });
    }

    return res.json(mapProductRow(rows[0]));
  }),
);

app.post(
  "/api/products/seed-mock",
  asyncHandler(async (req, res) => {
    const insertedCount = await seedMissingMockProducts();
    const rows = await query("SELECT COUNT(*) AS totalProducts FROM products");

    return res.json({
      insertedCount,
      totalProducts: Number(rows[0].totalProducts || 0),
    });
  }),
);

app.post(
  "/api/products",
  asyncHandler(async (req, res) => {
    const { sku, name, brand, price, stock } = req.body;
    if (!sku || !name || !brand) {
      return res
        .status(400)
        .json({ message: "sku, name and brand are required" });
    }

    const normalizedSku = String(sku).trim();
    const duplicated = await query(
      "SELECT id FROM products WHERE LOWER(sku) = LOWER(?) LIMIT 1",
      [normalizedSku],
    );
    if (duplicated.length > 0) {
      return res.status(409).json({ message: "sku already exists" });
    }

    const numericPrice = toNumber(price);
    const numericStock = toNumber(stock);
    if (numericPrice < 0 || numericStock < 0) {
      return res.status(400).json({ message: "price and stock must be >= 0" });
    }

    const result = await query(
      "INSERT INTO products (sku, name, brand, price, stock, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        normalizedSku,
        String(name).trim(),
        String(brand).trim(),
        numericPrice,
        numericStock,
        new Date(),
      ],
    );

    const rows = await query("SELECT * FROM products WHERE id = ?", [
      result.insertId,
    ]);
    return res.status(201).json(mapProductRow(rows[0]));
  }),
);

app.put(
  "/api/products/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { sku, name, brand, price, stock } = req.body;

    if (!id || !sku || !name || !brand) {
      return res
        .status(400)
        .json({ message: "id, sku, name and brand are required" });
    }

    const productRows = await query("SELECT id FROM products WHERE id = ?", [
      id,
    ]);
    if (productRows.length === 0) {
      return res.status(404).json({ message: "product not found" });
    }

    const duplicatedSku = await query(
      "SELECT id FROM products WHERE id <> ? AND LOWER(sku) = LOWER(?) LIMIT 1",
      [id, String(sku).trim()],
    );
    if (duplicatedSku.length > 0) {
      return res.status(409).json({ message: "sku already exists" });
    }

    const numericPrice = toNumber(price);
    const numericStock = toNumber(stock);
    if (numericPrice < 0 || numericStock < 0) {
      return res.status(400).json({ message: "price and stock must be >= 0" });
    }

    await query(
      "UPDATE products SET sku = ?, name = ?, brand = ?, price = ?, stock = ? WHERE id = ?",
      [
        String(sku).trim(),
        String(name).trim(),
        String(brand).trim(),
        numericPrice,
        numericStock,
        id,
      ],
    );

    const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
    return res.json(mapProductRow(rows[0]));
  }),
);

app.delete(
  "/api/products/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "invalid product id" });
    }

    const usedRows = await query(
      "SELECT id FROM order_items WHERE product_id = ? LIMIT 1",
      [id],
    );
    if (usedRows.length > 0) {
      return res
        .status(409)
        .json({ message: "cannot delete product used in orders" });
    }

    const result = await query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "product not found" });
    }

    return res.json({ message: "product deleted" });
  }),
);

app.get(
  "/api/orders",
  asyncHandler(async (req, res) => {
    const orderRows = await query("SELECT * FROM orders ORDER BY id DESC");
    if (orderRows.length === 0) {
      return res.json([]);
    }

    const orderIds = orderRows.map((item) => item.id);
    const itemRows = await query(
      `SELECT oi.*, p.name AS product_name, p.sku AS product_sku
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (?)
     ORDER BY oi.id ASC`,
      [orderIds],
    );

    const groupedItems = new Map();
    for (const item of itemRows.map(mapOrderItemRow)) {
      if (!groupedItems.has(item.order_id)) {
        groupedItems.set(item.order_id, []);
      }
      groupedItems.get(item.order_id).push(item);
    }

    const orders = orderRows.map((order) => ({
      ...mapOrderRow(order),
      items: groupedItems.get(order.id) || [],
    }));

    res.json(orders);
  }),
);

app.post(
  "/api/orders",
  asyncHandler(async (req, res) => {
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

    const fee = Math.max(0, toNumber(shippingFee));

    const orderResult = await withTransaction(async (connection) => {
      const normalizedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        if (!productId || !quantity || quantity <= 0) {
          throw Object.assign(new Error("invalid item payload"), {
            status: 400,
          });
        }

        const [productRows] = await connection.query(
          "SELECT id, sku, name, price, stock FROM products WHERE id = ? FOR UPDATE",
          [productId],
        );

        if (productRows.length === 0) {
          throw Object.assign(new Error(`product ${productId} not found`), {
            status: 400,
          });
        }

        const product = productRows[0];
        if (Number(product.stock) < quantity) {
          throw Object.assign(
            new Error(`insufficient stock for product ${productId}`),
            { status: 400 },
          );
        }

        const lineTotal = Number(product.price) * quantity;
        subtotal += lineTotal;
        normalizedItems.push({ product, quantity, lineTotal });
      }

      const [insertOrderResult] = await connection.query(
        `INSERT INTO orders (
        customer_name,
        customer_phone,
        notes,
        payment_method,
        payment_status,
        shipping_provider,
        shipping_fee,
        shipping_address,
        subtotal_amount,
        total_amount,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(customerName).trim(),
          customerPhone ? String(customerPhone).trim() : null,
          notes ? String(notes).trim() : null,
          paymentMethod || "cash",
          "pending",
          shippingProvider || null,
          fee,
          address ? String(address).trim() : null,
          subtotal,
          subtotal + fee,
          new Date(),
        ],
      );

      const orderId = insertOrderResult.insertId;

      for (const item of normalizedItems) {
        await connection.query(
          `INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          unit_price,
          line_total
        ) VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product.id,
            item.quantity,
            Number(item.product.price),
            item.lineTotal,
          ],
        );

        await connection.query(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.product.id],
        );
      }

      const [orderRows] = await connection.query(
        "SELECT * FROM orders WHERE id = ?",
        [orderId],
      );
      const [itemRows] = await connection.query(
        `SELECT oi.*, p.name AS product_name, p.sku AS product_sku
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
        [orderId],
      );

      return {
        ...mapOrderRow(orderRows[0]),
        items: itemRows.map(mapOrderItemRow),
      };
    });

    return res.status(201).json(orderResult);
  }),
);

app.get(
  "/api/dashboard",
  asyncHandler(async (req, res) => {
    const productStatsRows = await query(
      "SELECT COUNT(*) AS totalProducts, COALESCE(SUM(stock), 0) AS totalStock FROM products",
    );
    const orderStatsRows = await query(
      "SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_amount), 0) AS revenue FROM orders",
    );
    const lowStockRows = await query(
      "SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC, id DESC LIMIT 5",
    );

    const productStats = productStatsRows[0] || {};
    const orderStats = orderStatsRows[0] || {};

    res.json({
      totalProducts: Number(productStats.totalProducts || 0),
      totalStock: Number(productStats.totalStock || 0),
      totalOrders: Number(orderStats.totalOrders || 0),
      revenue: Number(orderStats.revenue || 0),
      lowStock: lowStockRows.map(mapProductRow),
    });
  }),
);

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
    state: frontendUrl,
  });

  return res.json({
    provider: "google",
    mode: "live",
    loginUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getGoogleCallbackUrl(req);

  if (!clientId || !clientSecret || !code) {
    const targetUrl =
      state ||
      getAuthRedirectUrl(req, "google", {
        name: "Demo Google User",
        email: "google.demo@example.com",
      });
    return res.redirect(targetUrl);
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
    const targetUrl = state || getAuthRedirectUrl(req, "google", profile);
    return res.redirect(targetUrl);
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
    state: frontendUrl,
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
  const state =
    typeof req.query.state === "string" ? req.query.state : frontendUrl;
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    `${frontendUrl}/api/auth/facebook/callback`;

  if (!clientId || !clientSecret || !code) {
    return res.redirect(
      getAuthRedirectUrl(req, "facebook", {
        name: "Demo Facebook User",
        email: "facebook.demo@example.com",
      }),
    );
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
    return res.redirect(state || getAuthRedirectUrl(req, "facebook", profile));
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

app.use((error, req, res, next) => {
  const statusCode = Number(error.status || 500);
  const message =
    statusCode >= 500
      ? error.message || "internal server error"
      : error.message || "request failed";

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
});

function startServer(preferredPort) {
  const port = Number(preferredPort) || 3000;
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

    initializeDatabase()
      .then(() => {
        console.log("Database initialized successfully");
      })
      .catch((error) => {
        console.error("Database initialization failed", error);
      });
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

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "./db.js";

const web = express();
const PORT = Number(process.env.PORT) || 3000;
const SECRET =
  process.env.JWT_SECRET ||
  "2aba446c149d";
const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "token";

const COOKIE_SAMESITE = (
  process.env.COOKIE_SAMESITE || "lax"
).toLowerCase();

const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production" ||
    COOKIE_SAMESITE === "none";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "";
const COOKIE_MAX_AGE_MS =
  Number(process.env.COOKIE_MAX_AGE_MS) ||
  1000 * 60 * 60; // 1 hour

const rawOrigins = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:3001"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (rawOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true,
  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: ["Content-Type", "Authorization"],
};

web.use(cors(corsOptions));
web.options(/.*/, cors(corsOptions));
web.use(express.json());

web.get("/", (req, res) => {
  res.send("API running...");
});

function getCookieValue(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;

  const parts = header.split(";").map((p) => p.trim());

  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(
        part.slice(name.length + 1)
      );
    }
  }

  return null;
}

const auth = (req, res, next) => {
  const header =
    req.headers.authorization || "";
  const bearer =
    header.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : "";
  const cookieToken = getCookieValue(
    req,
    AUTH_COOKIE_NAME
  );
  const token = bearer || cookieToken;

  if (!token) {
    return res.status(401).json({
      message: "Token байхгүй",
    });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token хүчингүй" });
  }
};

web.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});


web.post("/create-account", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginId = String(email || username || "").trim().toLowerCase();

    if (!loginId || !password) {
      return res.status(400).json({ message: "Мэдээлэл дутуу" });
    }


    const exists = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [loginId]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({
        message: "Энэ имэйл аль хэдийн бүртгэгдсэн"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [loginId, hashed]
    );

    res.json({ message: "Account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


web.post("/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginId = String(email || username || "").trim().toLowerCase();

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [loginId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Хэрэглэгч олдсонгүй"
      });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Нууц үг буруу"
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET,
      { expiresIn: "1h" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      path: "/",
      maxAge: COOKIE_MAX_AGE_MS,
    };

    if (COOKIE_DOMAIN) {
      cookieOptions.domain = COOKIE_DOMAIN;
    }

    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);

    res.json({
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

web.post("/logout", (req, res) => {
  const clearOptions = {
    path: "/",
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
  };

  if (COOKIE_DOMAIN) {
    clearOptions.domain = COOKIE_DOMAIN;
  }

  res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
  res.json({ message: "Logged out" });
});


web.post("/products", auth, async (req, res) => {
  try {
    const { productName, price, description, imageUrl } = req.body;

    if (!productName || !price) {
      return res.status(400).json({ message: "Мэдээлэл дутуу байна" });
    }

    await pool.query(
      `INSERT INTO products 
      (name, price, description, image_url, user_id)
      VALUES ($1, $2, $3, $4, $5)`,
      [productName, price, description, imageUrl, req.user.id]
    );

    res.json({ message: "Product added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


web.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, price, description, image_url, user_id
       FROM products
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


web.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM products WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Бараа олдсонгүй"
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


web.delete("/products/:id", auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT id FROM products WHERE id=$1 AND user_id=$2",
      [productId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "Энэ барааг устгах эрхгүй"
      });
    }

    await pool.query(
      "DELETE FROM products WHERE id=$1",
      [productId]
    );

    res.json({ message: "Бараа амжилттай устгагдлаа" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




web.post("/payment-pending", auth, async (req, res) => {
  const userId = req.user.id;
  const { orderId, method } = req.body;

  if (!orderId || !method) {
    return res.status(400).json({ message: "Мэдээлэл дутуу байна" });
  }

  try {
    const orderResult = await pool.query(
      "SELECT id, status FROM orders WHERE id=$1 AND user_id=$2",
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Захиалга олдсонгүй" });
    }

    const order = orderResult.rows[0];

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Захиалга төлөв өөрчлөгдсөн байна" });
    }

    await pool.query(
      `
      UPDATE orders
      SET status='paid'
      WHERE id=$1
      `, [orderId]
    );

    res.json({ message: "Төлбөр амжилттай хийгдлээ" });
  } catch (err) {
    console.error("Payment method error:", err);
    res.status(500).json({ message: "Server error" });
  }
})


web.post("/payment", auth, async (req, res) => {
  const userId = req.user.id;

  const {
    items,
    phone,
    province,
    district,
    khoroo,
    address,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Сагс хоосон байна" });
  }

  if (!phone || !province || !district || !khoroo || !address) {
    return res.status(400).json({
      message: "Хаягийн мэдээллийг бүрэн бөглөнө үү",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productIds = items.map((item) => item.productId);

    const productsResult = await client.query(
      `SELECT id, price FROM products WHERE id = ANY($1)`,
      [productIds]
    );

    if (productsResult.rows.length !== items.length) {
      throw new Error("Зарим бараа олдсонгүй");
    }

    const priceMap = {};
    productsResult.rows.forEach((p) => {
      priceMap[p.id] = p.price;
    });

    let totalPrice = 0;

    for (const item of items) {
      totalPrice += priceMap[item.productId] * item.quantity;
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders
      (user_id, phone, province, district, khoroo, address, total_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id
      `,
      [
        userId,
        phone,
        province,
        district,
        khoroo,
        address,
        totalPrice,
      ]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `
        INSERT INTO order_details
        (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
        `,
        [
          orderId,
          item.productId,
          item.quantity,
          priceMap[item.productId],
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Захиалга амжилттай үүслээ",
      orderId,
      totalPrice,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Payment error:", err);

    res.status(500).json({
      message: "Захиалга үүсгэх үед алдаа гарлаа",
    });
  } finally {
    client.release();
  }
});




web.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});

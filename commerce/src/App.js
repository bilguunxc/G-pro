import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import pool from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";

const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
if (!JWT_SECRET && isProd) {
  throw new Error("JWT_SECRET environment variable is required in production");
}


const SECRET = JWT_SECRET || "a7dd113c0fdfa43af5485b05d8d92a2ece60826056fbb4b9c1f6085bb3806cdea294601acc1cbe46bb54c799e7834a00";

const AUTH_COOKIE_NAME =
  (process.env.AUTH_COOKIE_NAME || "").trim() || "token";

const cookieSameSiteRaw = String( process.env.COOKIE_SAMESITE || "lax" ).toLowerCase();
const COOKIE_SAMESITE = ["lax", "strict", "none"].includes( cookieSameSiteRaw ) ? cookieSameSiteRaw : "lax";

const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : isProd || COOKIE_SAMESITE === "none";

const COOKIE_DOMAIN = (process.env.COOKIE_DOMAIN || "").trim();
const COOKIE_MAX_AGE_MS =
  Number(process.env.COOKIE_MAX_AGE_MS) ||
  1000 * 60 * 60; // 1 hour

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOriginSet = new Set(allowedOrigins);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOriginSet.has(origin)) {
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

if (isProd) {
  app.set("trust proxy", 1);
}
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  next();
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running...");
});


function csrfOriginCheck(req, res, next) {
  const method = String(req.method || "").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin) return next();

  if (!allowedOriginSet.has(origin)) {
    return res.status(403).json({
      message: "CSRF хамгаалалт: Origin зөвшөөрөгдөөгүй",
    });
  }

  next();
}

app.use(csrfOriginCheck);

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

const auth = async (req, res, next) => {
  const authHeader = String(req.headers.authorization || "");
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim() : "";
  const cookieToken = getCookieValue(req, AUTH_COOKIE_NAME);
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({
      message: "Token байхгүй"});
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res
      .status(401)
      .json({ message: "Token хүчингүй" });
  }

  const userId = payload?.id;
  if (!userId) {
    return res
      .status(401)
      .json({ message: "Token хүчингүй" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        username,
        role,
        birth_date,
        store_name,
        store_address
      FROM users
      WHERE id=$1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Хэрэглэгч олдсонгүй",
      });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
};

app.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin эрх шаардлагатай",
    });
  }
  next();
};

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Бүртгэл үүсгэх оролдлого хэт олон байна. Түр хүлээгээд дахин оролдоно уу.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Нэвтрэх оролдлого хэт олон байна. Түр хүлээгээд дахин оролдоно уу.",
  },
});

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const v = email.trim().toLowerCase();
  if (v.length < 5 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidUsername(username) {
  if (typeof username !== "string") return false;
  const v = username.trim().toLowerCase();
  if (v.length < 3 || v.length > 20) return false;
  if (v.includes("@")) return false;
  // letters, numbers, underscore, dot
  return /^[a-z0-9._-]+$/.test(v);
}

function parseBirthDate({ birthYear, birthMonth, birthDay }) {
  const y = Number(birthYear);
  const m = Number(birthMonth);
  const d = Number(birthDay);

  if (!Number.isInteger(y) || y < 1900 || y > 2100) return null;
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(d) || d < 1 || d > 31) return null;

  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() + 1 !== m ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }

  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );
  if (dt > todayUTC) return null;

  return dt.toISOString().slice(0, 10); // year-month-day
}

app.post("/create-account", signupLimiter, async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      birthYear,
      birthMonth,
      birthDay,
      storeName,
      storeAddress,
    } = req.body || {};

    const emailNorm = String(email || "").trim().toLowerCase();
    const usernameNorm = String(username || "")
      .trim()
      .toLowerCase();
    const storeNameNorm = String(storeName || "").trim();
    const storeAddressNorm = String(storeAddress || "").trim();
    const birthDate = parseBirthDate({
      birthYear,
      birthMonth,
      birthDay,
    });

    if (!emailNorm || !usernameNorm || !password) {
      return res.status(400).json({
        message: "Мэдээлэл дутуу байна",
      });
    }

    if (!isValidEmail(emailNorm)) {
      return res.status(400).json({
        message: "Имэйл буруу форматтай байна",
      });
    }

    if (!isValidUsername(usernameNorm)) {
      return res.status(400).json({
        message:
          "Username буруу байна (3-20 тэмдэгт, зөвхөн латин үсэг/тоо/._-)",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Нууц үг хамгийн багадаа 6 тэмдэгт байна",
      });
    }

    if (!birthDate) {
      return res.status(400).json({
        message:
          "Төрсөн огноо буруу байна (он/сар/өдөр)-өө шалгана уу",
      });
    }

    if (storeNameNorm && storeNameNorm.length > 80) {
      return res.status(400).json({
        message: "Дэлгүүрийн нэр хэт урт байна",
      });
    }

    if (storeAddressNorm && storeAddressNorm.length > 200) {
      return res.status(400).json({
        message: "Дэлгүүрийн хаяг хэт урт байна",
      });
    }

    const exists = await pool.query(
      "SELECT id, email, username FROM users WHERE email=$1 OR username=$2",
      [emailNorm, usernameNorm]
    );

    if (exists.rows.length > 0) {
      const takenEmail = exists.rows.some(
        (r) => String(r.email).toLowerCase() === emailNorm
      );
      const takenUsername = exists.rows.some(
        (r) =>
          String(r.username || "").toLowerCase() === usernameNorm
      );

      return res.status(400).json({
        message: takenEmail
          ? "Энэ имэйл аль хэдийн бүртгэгдсэн"
          : takenUsername
            ? "Энэ username аль хэдийн бүртгэгдсэн"
            : "Бүртгэлтэй хэрэглэгч байна",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, username, password, birth_date, store_name, store_address) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        emailNorm,
        usernameNorm,
        hashed,
        birthDate,
        storeNameNorm || usernameNorm,
        storeAddressNorm || null,
      ]
    );

    res.json({ message: "Бүртгэл амжилттай үүслээ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});


app.post("/login", loginLimiter, async (req, res) => {
  try {
    const { loginId, email, username, password } = req.body || {};
    const ident = String(loginId || email || username || "")
      .trim()
      .toLowerCase();

    if (!ident || !password) {
      return res.status(400).json({
        message: "Имэйл/username болон нууц үгээ оруулна уу",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR username=$1",
      [ident]
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

    const role = user?.role || "user";
    const token = jwt.sign({ id: user.id }, SECRET, {
      expiresIn: "1h",
    });

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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role,
        birth_date: user.birth_date,
        store_name:
          (typeof user.store_name === "string" &&
          user.store_name.trim().length > 0
            ? user.store_name.trim()
            : "") || user.username,
        store_address: user.store_address || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});

app.post("/logout", (req, res) => {
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

app.patch("/account", auth, async (req, res) => {
  try {
    const {
      birthYear,
      birthMonth,
      birthDay,
      storeName,
      storeAddress,
    } = req.body || {};

    const birthDate = parseBirthDate({
      birthYear,
      birthMonth,
      birthDay,
    });

    if (!birthDate) {
      return res.status(400).json({
        message:
          "Төрсөн огноо буруу байна (он/сар/өдөр)-өө шалгана уу",
      });
    }

    const storeNameNorm = String(storeName || "").trim();
    const storeAddressNorm = String(storeAddress || "").trim();

    if (storeNameNorm && storeNameNorm.length > 80) {
      return res.status(400).json({
        message: "Дэлгүүрийн нэр хэт урт байна",
      });
    }

    if (storeAddressNorm && storeAddressNorm.length > 200) {
      return res.status(400).json({
        message: "Дэлгүүрийн хаяг хэт урт байна",
      });
    }

    const updated = await pool.query(
      `
      UPDATE users
      SET
        birth_date=$1,
        store_name=$2,
        store_address=$3
      WHERE id=$4
      RETURNING
        id,
        email,
        username,
        role,
        birth_date,
        store_name,
        store_address,
        created_at
      `,
      [
        birthDate,
        storeNameNorm || null,
        storeAddressNorm || null,
        req.user.id,
      ]
    );

    res.json({ user: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});

app.patch("/account/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      currentPassword.length === 0
    ) {
      return res.status(400).json({
        message: "Одоогийн нууц үгээ оруулна уу",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({
        message: "Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байна",
      });
    }

    const result = await pool.query(
      "SELECT password FROM users WHERE id=$1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Хэрэглэгч олдсонгүй",
      });
    }

    const match = await bcrypt.compare(
      currentPassword,
      result.rows[0].password
    );

    if (!match) {
      return res.status(401).json({
        message: "Одоогийн нууц үг буруу",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [hashed, req.user.id]
    );

    res.json({ message: "Нууц үг амжилттай солигдлоо" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});


app.post("/products", auth, async (req, res) => {
  try {
    const { productName, price, description, imageUrl } = req.body;

    if (!productName || !price) {
      return res.status(400).json({ message: "Мэдээлэл дутуу байна" });
    }

    const storeAddress = String(
      req.user?.store_address || ""
    ).trim();
    if (!storeAddress) {
      return res.status(400).json({
        message:
          "Бараа нэмэхийн өмнө Профайл хэсгээс дэлгүүрийн хаягаа бүртгэнэ үү",
      });
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
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});


app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.price,
        p.description,
        p.image_url,
        p.user_id,
        COALESCE(NULLIF(u.store_name, ''), u.username) AS store_name
      FROM products p
      LEFT JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});


app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.*,
        COALESCE(NULLIF(u.store_name, ''), u.username) AS store_name,
        u.store_address
      FROM products p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.id=$1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Бараа олдсонгүй"
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});


app.delete("/products/:id", auth, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;

    const isAdmin = req.user?.role === "admin";

    if (!isAdmin) {
      const result = await pool.query(
        "SELECT id FROM products WHERE id=$1 AND user_id=$2",
        [productId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          message: "Энэ барааг устгах эрхгүй",
        });
      }
    } else {
      const exists = await pool.query(
        "SELECT id FROM products WHERE id=$1",
        [productId]
      );

      if (exists.rows.length === 0) {
        return res.status(404).json({
          message: "Бараа олдсонгүй",
        });
      }
    }

    await pool.query(
      "DELETE FROM products WHERE id=$1",
      [productId]
    );

    res.json({ message: "Бараа амжилттай устгагдлаа" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});

// Admin: view/manage products
app.get("/admin/products", auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.price,
        p.description,
        p.image_url,
        p.user_id,
        p.created_at,
        u.email AS owner_email,
        u.username AS owner_username,
        COALESCE(NULLIF(u.store_name, ''), u.username) AS store_name,
        u.store_address
      FROM products p
      LEFT JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});

app.delete("/admin/products/:id", auth, requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;

    const exists = await pool.query(
      "SELECT id FROM products WHERE id=$1",
      [productId]
    );

    if (exists.rows.length === 0) {
      return res.status(404).json({
        message: "Бараа олдсонгүй",
      });
    }

    await pool.query("DELETE FROM products WHERE id=$1", [productId]);

    res.json({ message: "Бараа амжилттай устгагдлаа" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});

// Admin: manage users/roles
app.get("/admin/users", auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        username,
        role,
        birth_date,
        created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});

app.patch("/admin/users/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body?.role || "").trim().toLowerCase();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "User id буруу байна",
      });
    }

    if (role !== "admin" && role !== "user") {
      return res.status(400).json({
        message: "Role нь зөвхөн admin эсвэл user байна",
      });
    }

    const current = await pool.query(
      "SELECT id, role FROM users WHERE id=$1",
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({
        message: "Хэрэглэгч олдсонгүй",
      });
    }

    const currentRole = current.rows[0].role || "user";

    // Prevent demoting the last admin.
    if (currentRole === "admin" && role === "user") {
      const countRes = await pool.query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role='admin'"
      );
      const adminCount = countRes.rows?.[0]?.count ?? 0;
      if (adminCount <= 1) {
        return res.status(400).json({
          message:
            "Сүүлчийн admin-ыг user болгох боломжгүй",
        });
      }
    }

    const updated = await pool.query(
      `
      UPDATE users
      SET role=$1
      WHERE id=$2
      RETURNING id, email, username, role, birth_date, created_at
      `,
      [role, id]
    );

    res.json({ user: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
});




app.post("/payment-pending", auth, async (req, res) => {
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
    res.status(500).json({ message: "Серверийн алдаа" });
  }
})


app.post("/payment", auth, async (req, res) => {
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




app.listen(PORT, () => {
  console.log(`Server running http://localhost:${PORT}`);
});

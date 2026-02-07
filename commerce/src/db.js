import pkg from "pg";
const { Pool } = pkg;

const hasDatabaseUrl =
  typeof process.env.DATABASE_URL === "string" &&
  process.env.DATABASE_URL.length > 0;

const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.PGSSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : new Pool({
      user: process.env.PGUSER || "commerce_user",
      host: process.env.PGHOST || "localhost",
      database: process.env.PGDATABASE || "commerce",
      password: process.env.PGPASSWORD || "1234",
      port: Number(process.env.PGPORT) || 5432,
    });

pool.on("connect", () => {
  console.log("database connected");
});

export default pool;

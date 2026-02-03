import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "commerce_user",
  host: "localhost",
  database: "commerce",
  password: "1234",
  port: 5432,
});

pool.on("connect", () => {
  console.log("database connected");
});

export default pool;

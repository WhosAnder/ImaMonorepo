import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("[Database] ❌ DATABASE_URL environment variable is required");
  console.error("[Database] Please set DATABASE_URL in your Railway environment variables");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  max: 20,
  min: 2,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("[Database] pool error:", err);
});

pool.on("connect", () => {
  console.log("[Database] pool connected");
});

const db = drizzle({ client: pool });

export { db };

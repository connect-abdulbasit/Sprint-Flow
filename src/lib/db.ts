import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;

  var __db: ReturnType<typeof drizzle> | undefined;
}

const connectionString = process.env.DATABASE_URL ?? "";
const isRemoteDb = connectionString.includes("supabase.com");

const pool =
  globalThis.__pgPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
  });

if (!globalThis.__pgPool) {
  globalThis.__pgPool = pool;
}

export const db = globalThis.__db ?? drizzle(pool);

if (!globalThis.__db) {
  globalThis.__db = db;
}

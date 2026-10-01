import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Shared hosting caps MySQL connections per user, so keep the pool small.
  const pool = mysql.createPool({ uri: url, connectionLimit: 5, enableKeepAlive: true });
  return drizzle(pool, { schema, mode: "default" });
}

type Db = ReturnType<typeof createDb>;

// Reuse one pool across dev hot reloads instead of leaking a new one per edit.
const globalForDb = globalThis as unknown as { db?: Db };

/** Lazily connects, so builds and pages that never touch the DB don't need DATABASE_URL. */
export function getDb(): Db {
  return (globalForDb.db ??= createDb());
}

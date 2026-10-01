import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

// Reads DATABASE_URL from .env.local like Next does. `npm run db:generate` after schema edits, then `npm run db:migrate`.
export default defineConfig({
  dialect: "mysql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});

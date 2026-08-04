import "server-only";
import postgres from "postgres";

// Single postgres.js client, reused across hot-reloads in dev.
// Neon pooler (PgBouncer) requires prepare:false. SSL comes from the URL (sslmode=require).
const globalForDb = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local (Neon connection string).");
}

export const sql =
  globalForDb.__sql ??
  postgres(connectionString, {
    prepare: false,
    idle_timeout: 20,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__sql = sql;

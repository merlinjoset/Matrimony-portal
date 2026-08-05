import "server-only";
import postgres from "postgres";

// Single postgres.js client, reused across hot-reloads in dev.
// Neon pooler (PgBouncer) requires prepare:false. SSL comes from the URL (sslmode=require).
//
// postgres.js connects lazily (only on the first query), so it is safe to construct this
// even when DATABASE_URL is absent - which is the case during `next build` (env vars are
// only injected at runtime). At runtime DATABASE_URL is set and the real connection is used.
const globalForDb = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

const connectionString = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

export const sql =
  globalForDb.__sql ??
  postgres(connectionString, {
    prepare: false,
    idle_timeout: 20,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__sql = sql;

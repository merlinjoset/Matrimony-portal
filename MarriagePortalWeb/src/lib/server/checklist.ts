import "server-only";
import { sql } from "./db";
import { APPROVAL_CHECKLIST as DEFAULT_CHECKLIST } from "@/lib/types";

/**
 * Per-level approval checklist, editable by an admin (stored as JSON in TblSettings under one key).
 * Falls back to the built-in defaults for any level that has not been customised.
 */

const KEY = "approval_checklist";
const LEVELS = [1, 2, 3] as const;
const MAX_ITEMS = 15;
const MAX_LEN = 200;

export async function getApprovalChecklist(): Promise<Record<number, string[]>> {
  const rows = await sql`SELECT "Value" FROM "TblSettings" WHERE "Key" = ${KEY} LIMIT 1`;
  const raw = rows[0]?.Value as string | undefined;
  let parsed: Record<string, unknown> | null = null;
  if (raw) {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object") parsed = p as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }
  const out: Record<number, string[]> = {};
  for (const lvl of LEVELS) {
    const arr = parsed && Array.isArray(parsed[lvl]) ? (parsed[lvl] as unknown[]) : null;
    out[lvl] = arr
      ? arr.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
      : [...(DEFAULT_CHECKLIST[lvl] ?? [])];
  }
  return out;
}

export async function saveApprovalChecklist(config: Record<number, string[]>): Promise<void> {
  const clean: Record<number, string[]> = {};
  for (const lvl of LEVELS) {
    const arr = Array.isArray(config[lvl]) ? config[lvl] : [];
    clean[lvl] = arr
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim().slice(0, MAX_LEN))
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  }
  const value = JSON.stringify(clean);
  await sql`
    INSERT INTO "TblSettings" ("Key","Value","UpdatedAt") VALUES (${KEY}, ${value}, now())
    ON CONFLICT ("Key") DO UPDATE SET "Value" = ${value}, "UpdatedAt" = now()`;
}

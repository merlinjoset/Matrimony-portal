import "server-only";
import { sql } from "./db";

/**
 * Which admin users are assigned to approve each verification level. Set by a Super Admin
 * (see /admin/approvers), stored as JSON in TblSettings. When a level has assignees, only
 * they (plus any Super Admin) may approve it; when a level has none, the existing role-rank
 * gate applies, so nothing breaks before assignments are configured.
 */

const KEY = "approval_assignments";
const LEVELS = [1, 2, 3] as const;

export async function getLevelAssignments(): Promise<Record<number, string[]>> {
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
  for (const l of LEVELS) {
    const arr = parsed && Array.isArray(parsed[l]) ? (parsed[l] as unknown[]) : [];
    out[l] = arr.filter((s): s is string => typeof s === "string" && s.length > 0);
  }
  return out;
}

export async function saveLevelAssignments(config: Record<number, string[]>): Promise<void> {
  const clean: Record<number, string[]> = {};
  for (const l of LEVELS) {
    const arr = Array.isArray(config[l]) ? config[l] : [];
    clean[l] = [...new Set(arr.filter((s): s is string => typeof s === "string" && s.length > 0))].slice(0, 50);
  }
  const value = JSON.stringify(clean);
  await sql`
    INSERT INTO "TblSettings" ("Key","Value","UpdatedAt") VALUES (${KEY}, ${value}, now())
    ON CONFLICT ("Key") DO UPDATE SET "Value" = ${value}, "UpdatedAt" = now()`;
}

/**
 * Whether `userId` (with `role`) may approve `level`. A Super Admin always may. Otherwise, if
 * the level has assignees, only they may; if it has none, fall back to `roleAllowed` (the
 * existing role-rank gate).
 */
export async function canApproveLevel(
  level: number,
  userId: string,
  role: string,
  roleAllowed: boolean
): Promise<boolean> {
  if (role === "Super Admin") return true;
  const assigned = (await getLevelAssignments())[level] ?? [];
  if (assigned.length === 0) return roleAllowed;
  return assigned.includes(userId);
}

/** Name + email of the active staff assigned to approve `level` (for notifications). Empty if none. */
export async function getApproverContacts(level: number): Promise<{ name: string; email: string }[]> {
  const ids = (await getLevelAssignments())[level] ?? [];
  if (!ids.length) return [];
  const rows = await sql`
    SELECT "Name","Email" FROM "TblUsers"
    WHERE "Id" = ANY(${ids}) AND "IsDeleted" = false AND "Status" <> 'Disabled'
      AND "Email" IS NOT NULL AND "Email" <> ''`;
  return rows.map((r) => ({ name: (r.Name as string) ?? "Approver", email: r.Email as string }));
}

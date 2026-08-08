import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { sql } from "./db";
import { validateMembership } from "./queries";
import type { MemberSession } from "@/lib/types";

// ---- password hashing (scrypt, no external deps) ----
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export interface AuthResult {
  ok: boolean;
  status: number;
  message?: string;
  session?: MemberSession & { username: string };
}

/**
 * Create a member login (username + password) against a valid membership card.
 * The account starts as 'Pending' - a parish admin must activate it before sign-in works.
 */
export async function signup(membershipNo: string, username: string, password: string): Promise<AuthResult> {
  const user = (username ?? "").trim();
  if (user.length < 3) return { ok: false, status: 400, message: "Username must be at least 3 characters." };
  if (!/^[a-zA-Z0-9_.@-]+$/.test(user)) return { ok: false, status: 400, message: "Username may only contain letters, numbers and . _ @ -" };
  if ((password ?? "").length < 6) return { ok: false, status: 400, message: "Password must be at least 6 characters." };

  const membership = await validateMembership(membershipNo);
  if (!membership.valid || !membership.memberId) return { ok: false, status: 400, message: membership.message ?? "Invalid membership card." };

  const cardTaken = await sql`SELECT 1 FROM "TblMemberAccounts" WHERE "MembershipNo" = ${membershipNo.trim()} AND "IsDeleted" = false LIMIT 1`;
  if (cardTaken.length) return { ok: false, status: 409, message: "An account already exists for this membership card. Please sign in." };

  const nameTaken = await sql`SELECT 1 FROM "TblMemberAccounts" WHERE lower("Username") = lower(${user}) AND "IsDeleted" = false LIMIT 1`;
  if (nameTaken.length) return { ok: false, status: 409, message: "That username is already taken." };

  await sql`
    INSERT INTO "TblMemberAccounts" ("Id","MemberId","MembershipNo","Name","Username","PasswordHash","Status","CreatedAt","IsDeleted")
    VALUES (${crypto.randomUUID()}, ${membership.memberId}, ${membershipNo.trim()}, ${membership.name ?? "Member"}, ${user}, ${hashPassword(password)}, 'Pending', now(), false)`;

  return {
    ok: true,
    status: 201,
    message: "Account created. A parish admin will activate it shortly - you can sign in once it is approved.",
  };
}

// Credential-sharing guard: if an account signs in from this many distinct IPs within the
// window, we treat the login as shared and lock the account until an admin re-activates it.
const SHARE_WINDOW_MINUTES = 60;
const MAX_DISTINCT_IPS = 4;

/** Sign in with username + password. Only 'Active' (admin-approved) accounts may sign in.
 *  The client IP is logged, and accounts used from too many locations at once are locked. */
export async function login(username: string, password: string, ip?: string | null, userAgent?: string | null): Promise<AuthResult> {
  const rows = await sql`
    SELECT "Id","MemberId","MembershipNo","Name","Username","PasswordHash","Status"
    FROM "TblMemberAccounts"
    WHERE lower("Username") = lower(${(username ?? "").trim()}) AND "IsDeleted" = false
    LIMIT 1`;
  const account = rows[0];
  if (!account || !verifyPassword(password ?? "", account.PasswordHash as string)) {
    return { ok: false, status: 401, message: "Invalid username or password." };
  }
  if (account.Status === "Pending") return { ok: false, status: 403, message: "Your account is awaiting admin activation. Please try again later." };
  if (account.Status !== "Active") return { ok: false, status: 403, message: "This account is disabled. Please contact the parish office." };

  const cleanIp = (ip ?? "").trim() || null;

  // Record this successful sign-in with its IP.
  await sql`
    INSERT INTO "TblLoginLog" ("Id","MemberAccountId","Username","IpAddress","UserAgent","Success","CreatedAt")
    VALUES (${crypto.randomUUID()}, ${account.Id as string}, ${account.Username as string}, ${cleanIp}, ${(userAgent ?? "").slice(0, 400) || null}, true, now())`;

  // Detect credential sharing: too many distinct IPs in a short window.
  const distinct = await sql`
    SELECT count(DISTINCT "IpAddress")::int AS c
    FROM "TblLoginLog"
    WHERE "MemberAccountId" = ${account.Id as string}
      AND "Success" = true AND "IpAddress" IS NOT NULL
      AND "CreatedAt" > now() - (${SHARE_WINDOW_MINUTES} * interval '1 minute')`;
  if (Number(distinct[0]?.c ?? 0) >= MAX_DISTINCT_IPS) {
    await sql`UPDATE "TblMemberAccounts" SET "Status" = 'Disabled', "UpdatedAt" = now() WHERE "Id" = ${account.Id as string}`;
    return { ok: false, status: 403, message: "This account was signed in from too many different locations and has been locked for security. Please contact the parish office to restore access." };
  }

  return {
    ok: true,
    status: 200,
    session: {
      memberId: account.MemberId as string,
      name: account.Name as string,
      membershipNo: account.MembershipNo as string,
      username: account.Username as string,
    },
  };
}

/**
 * Admin creates a member login directly. Unlike self sign-up, the account is created 'Active'
 * (the admin is vouching for it) so the member can sign in immediately.
 */
export async function adminCreateMemberAccount(
  membershipNo: string,
  username: string,
  password: string,
  email?: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  const user = (username ?? "").trim();
  const mail = (email ?? "").trim();
  if (user.length < 3) return { ok: false, status: 400, message: "Username must be at least 3 characters." };
  if (!/^[a-zA-Z0-9_.@-]+$/.test(user)) return { ok: false, status: 400, message: "Username may only contain letters, numbers and . _ @ -" };
  if ((password ?? "").length < 6) return { ok: false, status: 400, message: "Password must be at least 6 characters." };
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, status: 400, message: "Please enter a valid email address." };

  const membership = await validateMembership(membershipNo);
  if (!membership.valid || !membership.memberId) return { ok: false, status: 400, message: membership.message ?? "Invalid membership card." };

  const cardTaken = await sql`SELECT 1 FROM "TblMemberAccounts" WHERE "MembershipNo" = ${membershipNo.trim()} AND "IsDeleted" = false LIMIT 1`;
  if (cardTaken.length) return { ok: false, status: 409, message: "An account already exists for this membership card." };

  const nameTaken = await sql`SELECT 1 FROM "TblMemberAccounts" WHERE lower("Username") = lower(${user}) AND "IsDeleted" = false LIMIT 1`;
  if (nameTaken.length) return { ok: false, status: 409, message: "That username is already taken." };

  // Purge tombstones of previously-removed accounts so the unique card/username indexes are free to reuse.
  await sql`DELETE FROM "TblMemberAccounts" WHERE "IsDeleted" = true AND ("MembershipNo" = ${membershipNo.trim()} OR lower("Username") = lower(${user}))`;

  await sql`
    INSERT INTO "TblMemberAccounts" ("Id","MemberId","MembershipNo","Name","Username","Email","PasswordHash","Status","CreatedAt","IsDeleted")
    VALUES (${crypto.randomUUID()}, ${membership.memberId}, ${membershipNo.trim()}, ${membership.name ?? "Member"}, ${user}, ${mail || null}, ${hashPassword(password)}, 'Active', now(), false)`;

  return { ok: true, status: 201 };
}

// ---- admin: manage member accounts ----
export interface MemberAccountRow {
  id: string;
  memberId: string;
  membershipNo: string;
  name: string;
  username: string;
  email: string | null;
  status: string;
  createdAt: string;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
}

export async function listMemberAccounts(): Promise<MemberAccountRow[]> {
  const rows = await sql`
    SELECT a."Id", a."MemberId", a."MembershipNo", a."Name", a."Username", a."Email", a."Status", a."CreatedAt",
           ll."IpAddress" AS "LastIp", ll."CreatedAt" AS "LastLoginAt"
    FROM "TblMemberAccounts" a
    LEFT JOIN LATERAL (
      SELECT "IpAddress", "CreatedAt" FROM "TblLoginLog" l
      WHERE l."MemberAccountId" = a."Id" AND l."Success" = true
      ORDER BY l."CreatedAt" DESC LIMIT 1
    ) ll ON true
    WHERE a."IsDeleted" = false ORDER BY a."CreatedAt" DESC`;
  return rows.map((r) => ({
    id: r.Id as string,
    memberId: r.MemberId as string,
    membershipNo: r.MembershipNo as string,
    name: r.Name as string,
    username: r.Username as string,
    email: (r.Email as string) ?? null,
    status: r.Status as string,
    createdAt: new Date(r.CreatedAt as string).toISOString(),
    lastLoginIp: (r.LastIp as string) ?? null,
    lastLoginAt: r.LastLoginAt ? new Date(r.LastLoginAt as string).toISOString() : null,
  }));
}

export async function setMemberAccountStatus(id: string, status: string): Promise<boolean> {
  if (!["Pending", "Active", "Disabled"].includes(status)) return false;
  const rows = await sql`UPDATE "TblMemberAccounts" SET "Status" = ${status}, "UpdatedAt" = now() WHERE "Id" = ${id} AND "IsDeleted" = false RETURNING "Id"`;
  return rows.length > 0;
}

/** Admin resets a member's login password. */
export async function setMemberAccountPassword(id: string, password: string): Promise<{ ok: boolean; status: number; message?: string }> {
  if ((password ?? "").length < 6) return { ok: false, status: 400, message: "Password must be at least 6 characters." };
  const rows = await sql`
    UPDATE "TblMemberAccounts" SET "PasswordHash" = ${hashPassword(password)}, "UpdatedAt" = now()
    WHERE "Id" = ${id} AND "IsDeleted" = false RETURNING "Id"`;
  return rows.length ? { ok: true, status: 204 } : { ok: false, status: 404, message: "Member account not found." };
}

// ---- admin (staff) login: password set by an admin, used to sign in to the admin panel ----

export interface AdminAuthResult {
  ok: boolean;
  status: number;
  message?: string;
  user?: { id: string; name: string; email: string; role: string };
}

/** Set (or reset) a staff user's admin-panel password. Only 'Active' users can then sign in. */
export async function setAdminUserPassword(id: string, password: string): Promise<{ ok: boolean; status: number; message?: string }> {
  if ((password ?? "").length < 6) return { ok: false, status: 400, message: "Password must be at least 6 characters." };
  const rows = await sql`
    UPDATE "TblUsers" SET "PasswordHash" = ${hashPassword(password)}, "UpdatedAt" = now()
    WHERE "Id" = ${id} AND "IsDeleted" = false RETURNING "Id"`;
  return rows.length ? { ok: true, status: 204 } : { ok: false, status: 404, message: "User not found." };
}

/** Sign in to the admin panel with email + password. Only 'Active' staff with a password set may sign in. */
export async function adminLogin(email: string, password: string): Promise<AdminAuthResult> {
  const rows = await sql`
    SELECT "Id","Name","Email","Role","Status","PasswordHash"
    FROM "TblUsers"
    WHERE lower("Email") = lower(${(email ?? "").trim()}) AND "IsDeleted" = false
    LIMIT 1`;
  const u = rows[0];
  if (!u || !u.PasswordHash || !verifyPassword(password ?? "", u.PasswordHash as string)) {
    return { ok: false, status: 401, message: "Invalid email or password." };
  }
  if (u.Status !== "Active") return { ok: false, status: 403, message: "This staff account is not active. Ask an admin to activate it." };
  return { ok: true, status: 200, user: { id: u.Id as string, name: u.Name as string, email: u.Email as string, role: u.Role as string } };
}

/** True once at least one staff user has a password. Until then the admin panel stays open (bootstrap). */
export async function anyAdminHasPassword(): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM "TblUsers" WHERE "PasswordHash" IS NOT NULL AND "IsDeleted" = false LIMIT 1`;
  return rows.length > 0;
}

export async function getAdminUserById(id: string): Promise<{ id: string; name: string; email: string; role: string } | null> {
  const rows = await sql`SELECT "Id","Name","Email","Role" FROM "TblUsers" WHERE "Id" = ${id} AND "IsDeleted" = false LIMIT 1`;
  const u = rows[0];
  return u ? { id: u.Id as string, name: u.Name as string, email: u.Email as string, role: u.Role as string } : null;
}

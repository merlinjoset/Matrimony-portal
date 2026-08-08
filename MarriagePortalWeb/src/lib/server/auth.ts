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

/** Sign in with username + password. Only 'Active' (admin-approved) accounts may sign in. */
export async function login(username: string, password: string): Promise<AuthResult> {
  const rows = await sql`
    SELECT "MemberId","MembershipNo","Name","Username","PasswordHash","Status"
    FROM "TblMemberAccounts"
    WHERE lower("Username") = lower(${(username ?? "").trim()}) AND "IsDeleted" = false
    LIMIT 1`;
  const account = rows[0];
  if (!account || !verifyPassword(password ?? "", account.PasswordHash as string)) {
    return { ok: false, status: 401, message: "Invalid username or password." };
  }
  if (account.Status === "Pending") return { ok: false, status: 403, message: "Your account is awaiting admin activation. Please try again later." };
  if (account.Status !== "Active") return { ok: false, status: 403, message: "This account is disabled. Please contact the parish office." };

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

// ---- admin: manage member accounts ----
export interface MemberAccountRow {
  id: string;
  memberId: string;
  membershipNo: string;
  name: string;
  username: string;
  status: string;
  createdAt: string;
}

export async function listMemberAccounts(): Promise<MemberAccountRow[]> {
  const rows = await sql`
    SELECT "Id","MemberId","MembershipNo","Name","Username","Status","CreatedAt"
    FROM "TblMemberAccounts" WHERE "IsDeleted" = false ORDER BY "CreatedAt" DESC`;
  return rows.map((r) => ({
    id: r.Id as string,
    memberId: r.MemberId as string,
    membershipNo: r.MembershipNo as string,
    name: r.Name as string,
    username: r.Username as string,
    status: r.Status as string,
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  }));
}

export async function setMemberAccountStatus(id: string, status: string): Promise<boolean> {
  if (!["Pending", "Active", "Disabled"].includes(status)) return false;
  const rows = await sql`UPDATE "TblMemberAccounts" SET "Status" = ${status}, "UpdatedAt" = now() WHERE "Id" = ${id} AND "IsDeleted" = false RETURNING "Id"`;
  return rows.length > 0;
}

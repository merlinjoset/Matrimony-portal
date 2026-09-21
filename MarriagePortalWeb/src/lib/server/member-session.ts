import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// A signed, httpOnly session cookie for a signed-in member (or verified guest).
// This is the server's source of truth for "who is calling" - member-scoped API routes read
// it via requireMember() instead of trusting a memberId passed in the URL or body, which a
// visitor could forge (the memberId is not secret). Mirrors admin-session.ts.
export const MEMBER_COOKIE = "csi_member_sess";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return (
    process.env.MEMBER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    "csi-member-fallback-secret"
  );
}

function sign(memberId: string): string {
  // Domain-separate from the admin token so the two cookies can never be swapped.
  return createHmac("sha256", secret()).update(`member:${memberId}`).digest("hex");
}

/** token = "<memberId>.<hmac>" */
export function createMemberSessionToken(memberId: string): string {
  return `${memberId}.${sign(memberId)}`;
}

export function verifyMemberSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const memberId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(memberId);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return memberId;
}

/** Read and verify the member session from the request cookies. Returns the memberId or null. */
export async function getMemberSession(): Promise<string | null> {
  const store = await cookies();
  return verifyMemberSessionToken(store.get(MEMBER_COOKIE)?.value);
}

export function buildMemberSetCookie(memberId: string): string {
  const token = createMemberSessionToken(memberId);
  return `${MEMBER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function buildMemberClearCookie(): string {
  return `${MEMBER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

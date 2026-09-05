import "server-only";
import { createHash, createHmac, randomInt, scryptSync, timingSafeEqual } from "crypto";
import { sql } from "./db";
import { sendMail } from "./mailer";

/**
 * Email OTP for non-members. A 6-digit code is emailed (via the same SMTP transport the
 * rest of the app uses), stored hashed in TblEmailOtp with a short expiry and attempt cap.
 * A successful verification returns a short-lived HMAC-signed token that the signup and
 * profile-create endpoints accept in place of a parish membership card.
 */

function secret(): string {
  // Same signing secret the admin session uses.
  return process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL || "csi-admin-fallback-secret";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MIN = 10; // code lifetime
const MAX_ATTEMPTS = 5; // wrong-code attempts before the code is burned
const RESEND_GAP_SEC = 45; // minimum gap between two sends to the same email
const MAX_SENDS_PER_HOUR = 6; // per-email send cap
const TOKEN_TTL_MS = 30 * 60 * 1000; // verified-email token lifetime (time to finish the form)

const normalise = (email: string) => (email ?? "").trim().toLowerCase();

function hashCode(code: string, email: string): Buffer {
  // Salt with the email so a leaked hash cannot be replayed against another address.
  return scryptSync(code, `otp:${normalise(email)}`, 32);
}

export interface OtpSendResult {
  ok: boolean;
  message: string;
}
export interface OtpVerifyResult {
  ok: boolean;
  message: string;
  token?: string;
}

/** Generate + email a 6-digit code. Rate limited per email. Never throws. */
export async function sendEmailOtp(rawEmail: string): Promise<OtpSendResult> {
  const email = normalise(rawEmail);
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };

  try {
    const recent = await sql`
      SELECT "CreatedAt" FROM "TblEmailOtp"
      WHERE "Email" = ${email} AND "CreatedAt" > now() - interval '1 hour'
      ORDER BY "CreatedAt" DESC`;
    if (recent.length >= MAX_SENDS_PER_HOUR)
      return { ok: false, message: "Too many codes requested for this email. Please try again later." };
    if (recent[0] && Date.now() - new Date(recent[0].CreatedAt as string).getTime() < RESEND_GAP_SEC * 1000)
      return { ok: false, message: "Please wait a moment before requesting another code." };

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000).toISOString();
    await sql`
      INSERT INTO "TblEmailOtp" ("Id","Email","CodeHash","ExpiresAt","Consumed","Attempts","CreatedAt")
      VALUES (${crypto.randomUUID()}, ${email}, ${hashCode(code, email).toString("hex")}, ${expiresAt}, false, 0, now())`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:460px;margin:auto;color:#2c2522;">
        <h2 style="color:#8a2a38;margin:0 0 6px;">CSI Holy Matrimony</h2>
        <p style="color:#6b6b6b;margin:0 0 18px;">Use this code to verify your email and continue your registration.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#14224f;background:#f6f1e7;border:1px solid #e6dcc6;border-radius:10px;padding:16px;text-align:center;">${code}</div>
        <p style="color:#9a8f84;font-size:13px;margin:16px 0 0;">This code expires in ${CODE_TTL_MIN} minutes. If you did not request it, please ignore this email.</p>
        <p style="color:#9a8f84;font-size:12px;margin-top:22px;">CSI Holy Matrimony - CSI Tamil Parish, Dubai</p>
      </div>`;
    const sent = await sendMail({ to: email, subject: "Your CSI Holy Matrimony verification code", html });
    if (!sent) return { ok: false, message: "We couldn't send the email right now. Please try again shortly." };

    return { ok: true, message: `A 6-digit code has been sent to ${email}. It expires in ${CODE_TTL_MIN} minutes.` };
  } catch (err) {
    console.error("[otp] send failed:", err);
    return { ok: false, message: "We couldn't send the code right now. Please try again shortly." };
  }
}

/** Check a code. On success, burns the code and returns a signed verified-email token. */
export async function verifyEmailOtp(rawEmail: string, rawCode: string): Promise<OtpVerifyResult> {
  const email = normalise(rawEmail);
  const code = (rawCode ?? "").trim();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Please enter a valid email address." };
  if (!/^\d{6}$/.test(code)) return { ok: false, message: "Enter the 6-digit code from your email." };

  try {
    const rows = await sql`
      SELECT "Id","CodeHash","Attempts" FROM "TblEmailOtp"
      WHERE "Email" = ${email} AND "Consumed" = false AND "ExpiresAt" > now()
      ORDER BY "CreatedAt" DESC LIMIT 1`;
    const row = rows[0];
    if (!row) return { ok: false, message: "No valid code found. Please request a new one." };

    if ((row.Attempts as number) >= MAX_ATTEMPTS) {
      await sql`UPDATE "TblEmailOtp" SET "Consumed" = true WHERE "Id" = ${row.Id}`;
      return { ok: false, message: "Too many incorrect attempts. Please request a new code." };
    }

    const expected = Buffer.from(row.CodeHash as string, "hex");
    const candidate = hashCode(code, email);
    const good = candidate.length === expected.length && timingSafeEqual(candidate, expected);
    if (!good) {
      await sql`UPDATE "TblEmailOtp" SET "Attempts" = "Attempts" + 1 WHERE "Id" = ${row.Id}`;
      return { ok: false, message: "Incorrect code. Please try again." };
    }

    await sql`UPDATE "TblEmailOtp" SET "Consumed" = true WHERE "Id" = ${row.Id}`;
    return { ok: true, message: "Email verified.", token: signEmailToken(email) };
  } catch (err) {
    console.error("[otp] verify failed:", err);
    return { ok: false, message: "We couldn't verify the code right now. Please try again." };
  }
}

/** HMAC-signed token proving an email was OTP-verified. Format: base64url(payload).sig */
export function signEmailToken(rawEmail: string): string {
  const email = normalise(rawEmail);
  const payload = `${email}|${Date.now() + TOKEN_TTL_MS}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

/** Verify a token from signEmailToken. Returns the verified email when valid and unexpired. */
export function verifyEmailToken(token: string): { valid: boolean; email: string | null } {
  try {
    const [b64, sig] = (token ?? "").split(".");
    if (!b64 || !sig) return { valid: false, email: null };
    const payload = Buffer.from(b64, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false, email: null };
    const [email, expStr] = payload.split("|");
    if (!email || !expStr || Date.now() > Number(expStr)) return { valid: false, email: null };
    return { valid: true, email };
  } catch {
    return { valid: false, email: null };
  }
}

/**
 * Deterministic member id for a verified-email (non-member) registrant. The same email always
 * maps to the same id, so the account created at signup and the profile created moments later
 * share one owner id without threading it through the client. UUID-shaped so it drops into the
 * same MemberId / OwnerMemberId columns parish members use.
 */
export function guestMemberId(rawEmail: string): string {
  const h = createHash("sha256").update(`guest:${normalise(rawEmail)}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP email sending, configured entirely through environment variables:
 *   SMTP_HOST      - e.g. smtp.hostinger.com
 *   SMTP_PORT      - e.g. 465 (SSL) or 587 (STARTTLS); defaults to 587
 *   SMTP_SECURE    - "true" for port 465, else omit
 *   SMTP_USER      - the mailbox login, e.g. admin@csitamilparishdubai.com
 *   SMTP_PASS      - the mailbox password / app password
 *   SMTP_FROM      - the From address (defaults to SMTP_USER)
 *   ADMIN_NOTIFY_EMAIL - where new-profile notifications go (defaults to SMTP_FROM/SMTP_USER)
 *
 * If SMTP is not configured the sender is a safe no-op, so local dev and builds never break.
 */

let cached: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cached;
}

export function fromAddress(): string {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@csitamilparishdubai.com";
}

export function adminNotifyAddress(): string {
  return process.env.ADMIN_NOTIFY_EMAIL || fromAddress();
}

interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Send an email. Returns true if sent, false if SMTP is not configured or sending failed (never throws). */
export async function sendMail({ to, subject, html, text }: MailInput): Promise<boolean> {
  const t = transport();
  if (!t) {
    console.warn(`[mailer] SMTP not configured - skipped email "${subject}" to ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: fromAddress(), to, subject, html, text: text ?? html.replace(/<[^>]+>/g, " ") });
    return true;
  } catch (err) {
    console.error("[mailer] send failed:", err);
    return false;
  }
}

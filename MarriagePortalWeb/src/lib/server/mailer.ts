import "server-only";
import nodemailer from "nodemailer";
import { getEmailSettings, type EmailSettings } from "./settings";

/**
 * SMTP email sending. Configuration is resolved from the admin settings (TblSettings),
 * falling back to environment variables (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER,
 * SMTP_PASS, SMTP_FROM, ADMIN_NOTIFY_EMAIL, APP_BASE_URL).
 *
 * If SMTP is not configured the sender is a safe no-op, so nothing breaks.
 */

export function isConfigured(cfg: EmailSettings): boolean {
  return Boolean(cfg.host && cfg.user && cfg.pass);
}

interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function send(cfg: EmailSettings, { to, subject, html, text }: MailInput): Promise<boolean> {
  if (!isConfigured(cfg)) {
    console.warn(`[mailer] SMTP not configured - skipped email "${subject}" to ${to}`);
    return false;
  }
  const transport = nodemailer.createTransport({
    host: cfg.host!,
    port: cfg.port || 587,
    secure: cfg.secure,
    auth: { user: cfg.user!, pass: cfg.pass! },
  });
  const from = cfg.from || cfg.user!;
  await transport.sendMail({ from, to, subject, html, text: text ?? html.replace(/<[^>]+>/g, " ") });
  return true;
}

/** Send an email to an explicit recipient. Returns true if sent (never throws). */
export async function sendMail(input: MailInput): Promise<boolean> {
  try {
    return await send(await getEmailSettings(), input);
  } catch (err) {
    console.error("[mailer] send failed:", err);
    return false;
  }
}

/** Send an email to the configured parish-office notification address. */
export async function sendAdminMail(input: Omit<MailInput, "to">): Promise<boolean> {
  try {
    const cfg = await getEmailSettings();
    const to = cfg.notifyEmail || cfg.from || cfg.user;
    if (!to) {
      console.warn("[mailer] no notify address configured - skipped admin email");
      return false;
    }
    return await send(cfg, { ...input, to });
  } catch (err) {
    console.error("[mailer] admin send failed:", err);
    return false;
  }
}

/** Send a quick test email to verify the current configuration. Throws on failure so the caller can report why. */
export async function sendTestMail(to: string): Promise<void> {
  const cfg = await getEmailSettings();
  if (!isConfigured(cfg)) throw new Error("SMTP is not configured. Fill in host, username and password first.");
  const transport = nodemailer.createTransport({
    host: cfg.host!,
    port: cfg.port || 587,
    secure: cfg.secure,
    auth: { user: cfg.user!, pass: cfg.pass! },
  });
  await transport.sendMail({
    from: cfg.from || cfg.user!,
    to,
    subject: "CSI Holy Matrimony - test email",
    html: "<p>This is a test email from the CSI Holy Matrimony admin panel. Your SMTP settings are working.</p>",
  });
}

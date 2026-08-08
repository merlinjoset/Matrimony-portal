import "server-only";
import { sql } from "./db";

export interface EmailSettings {
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  pass: string | null; // stored, never returned to the client
  from: string | null;
  notifyEmail: string | null;
  appBaseUrl: string | null;
}

const KEYS = {
  host: "smtp_host",
  port: "smtp_port",
  secure: "smtp_secure",
  user: "smtp_user",
  pass: "smtp_pass",
  from: "smtp_from",
  notifyEmail: "admin_notify_email",
  appBaseUrl: "app_base_url",
} as const;

async function readAll(): Promise<Record<string, string>> {
  const rows = await sql`SELECT "Key","Value" FROM "TblSettings"`;
  const map: Record<string, string> = {};
  for (const r of rows) if (r.Value != null) map[r.Key as string] = r.Value as string;
  return map;
}

async function writeOne(key: string, value: string | null): Promise<void> {
  await sql`
    INSERT INTO "TblSettings" ("Key","Value","UpdatedAt") VALUES (${key}, ${value}, now())
    ON CONFLICT ("Key") DO UPDATE SET "Value" = ${value}, "UpdatedAt" = now()`;
}

/** Resolve email settings from the DB, falling back to environment variables. */
export async function getEmailSettings(): Promise<EmailSettings> {
  const db = await readAll();
  const host = db[KEYS.host] || process.env.SMTP_HOST || null;
  const user = db[KEYS.user] || process.env.SMTP_USER || null;
  const portStr = db[KEYS.port] || process.env.SMTP_PORT || "";
  const secureStr = db[KEYS.secure] ?? "";
  return {
    host,
    port: portStr ? Number(portStr) : null,
    secure: secureStr ? secureStr === "true" : process.env.SMTP_SECURE === "true" || Number(portStr) === 465,
    user,
    pass: db[KEYS.pass] || process.env.SMTP_PASS || null,
    from: db[KEYS.from] || process.env.SMTP_FROM || user,
    notifyEmail: db[KEYS.notifyEmail] || process.env.ADMIN_NOTIFY_EMAIL || db[KEYS.from] || process.env.SMTP_FROM || user,
    appBaseUrl: db[KEYS.appBaseUrl] || process.env.APP_BASE_URL || null,
  };
}

export interface SaveEmailSettingsInput {
  host?: string;
  port?: string;
  secure?: boolean;
  user?: string;
  pass?: string; // when omitted/empty, the existing password is kept
  from?: string;
  notifyEmail?: string;
  appBaseUrl?: string;
}

/** Persist email settings. A blank/undefined password leaves the stored one untouched. */
export async function saveEmailSettings(input: SaveEmailSettingsInput): Promise<void> {
  await writeOne(KEYS.host, (input.host ?? "").trim() || null);
  await writeOne(KEYS.port, (input.port ?? "").trim() || null);
  await writeOne(KEYS.secure, input.secure ? "true" : "false");
  await writeOne(KEYS.user, (input.user ?? "").trim() || null);
  await writeOne(KEYS.from, (input.from ?? "").trim() || null);
  await writeOne(KEYS.notifyEmail, (input.notifyEmail ?? "").trim() || null);
  await writeOne(KEYS.appBaseUrl, (input.appBaseUrl ?? "").trim() || null);
  if (input.pass && input.pass.length > 0) await writeOne(KEYS.pass, input.pass);
}

/** Whether a password is stored in the DB (so the UI can show "set" without revealing it). */
export async function hasStoredSmtpPassword(): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM "TblSettings" WHERE "Key" = ${KEYS.pass} AND "Value" IS NOT NULL AND "Value" <> '' LIMIT 1`;
  return rows.length > 0;
}

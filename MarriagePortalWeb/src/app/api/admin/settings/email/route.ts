import { getEmailSettings, saveEmailSettings, hasStoredSmtpPassword } from "@/lib/server/settings";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const cfg = await getEmailSettings();
  const hasPassword = await hasStoredSmtpPassword();
  // Never return the stored password.
  return Response.json({
    host: cfg.host ?? "",
    port: cfg.port != null ? String(cfg.port) : "",
    secure: cfg.secure,
    user: cfg.user ?? "",
    from: cfg.from ?? "",
    notifyEmail: cfg.notifyEmail ?? "",
    appBaseUrl: cfg.appBaseUrl ?? "",
    hasPassword: hasPassword || Boolean(process.env.SMTP_PASS),
  });
}

export async function PUT(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const body = (await req.json()) as {
    host?: string; port?: string; secure?: boolean; user?: string; pass?: string; from?: string; notifyEmail?: string; appBaseUrl?: string;
  };
  await saveEmailSettings(body);
  return new Response(null, { status: 204 });
}

import { sendTestMail } from "@/lib/server/mailer";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { to: string };
  const to = (body.to ?? "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return new Response(JSON.stringify({ message: "Enter a valid recipient email." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  try {
    await sendTestMail(to);
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ message: err instanceof Error ? err.message : "Send failed." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}

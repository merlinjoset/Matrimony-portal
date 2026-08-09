import { resetMemberDevice } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const ok = await resetMemberDevice(id);
  return ok ? new Response(null, { status: 204 }) : new Response("Account not found.", { status: 404 });
}

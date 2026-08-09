import { setProfileStatus } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const body = (await req.json()) as { status: string; note?: string | null };
  const ok = await setProfileStatus(id, body.status, body.note);
  return ok ? new Response(null, { status: 204 }) : new Response("Profile not found.", { status: 404 });
}

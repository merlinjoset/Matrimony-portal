import { reverifyProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Admin: confirm a verified listing is still valid (restarts the 6-month re-verification clock).
// A narrow action instead of PATCH /profiles/[id]/status, which never allows setting "Verified".
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const res = await reverifyProfile(id);
  return res.ok ? new Response(null, { status: 204 }) : new Response(res.message ?? "Could not re-verify.", { status: res.status });
}

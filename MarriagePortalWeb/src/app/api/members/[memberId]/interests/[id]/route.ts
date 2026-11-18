import { respondToInterest } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// The listing's family accepts or declines an Express Interest sent to them. The family is the
// signed-in member (from the session, not the URL id), and must own the listing it was sent to.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireMember();
  if (!g.ok) return g.response;
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  const res = await respondToInterest(id, g.memberId, status ?? "");
  return res.ok ? new Response(null, { status: 204 }) : new Response(res.message ?? "Not found.", { status: res.status });
}

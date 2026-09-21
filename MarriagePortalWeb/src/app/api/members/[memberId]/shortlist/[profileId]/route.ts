import { removeShortlist } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ memberId: string; profileId: string }> }) {
  const g = await requireMember();
  if (!g.ok) return g.response;
  const { profileId } = await params;
  const ok = await removeShortlist(g.memberId, profileId);
  return ok ? new Response(null, { status: 204 }) : new Response("Not found.", { status: 404 });
}

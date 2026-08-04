import { removeShortlist } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ memberId: string; profileId: string }> }) {
  const { memberId, profileId } = await params;
  const ok = await removeShortlist(memberId, profileId);
  return ok ? new Response(null, { status: 204 }) : new Response("Not found.", { status: 404 });
}

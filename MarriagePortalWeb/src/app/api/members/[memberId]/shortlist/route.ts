import { getShortlist, addShortlist } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// The caller's own shortlist - resolved from the session, not the URL id.
export async function GET() {
  const g = await requireMember();
  if (!g.ok) return g.response;
  return Response.json(await getShortlist(g.memberId));
}

export async function POST(req: Request) {
  const g = await requireMember();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { profileId: string };
  await addShortlist(g.memberId, body.profileId);
  return new Response(null, { status: 204 });
}

import { getShortlist, addShortlist } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return Response.json(await getShortlist(memberId));
}

export async function POST(req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const body = (await req.json()) as { profileId: string };
  await addShortlist(memberId, body.profileId);
  return new Response(null, { status: 204 });
}

import { getMemberSelf } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  if (!memberId) return Response.json({ name: null, mobile: null });
  return Response.json(await getMemberSelf(memberId));
}

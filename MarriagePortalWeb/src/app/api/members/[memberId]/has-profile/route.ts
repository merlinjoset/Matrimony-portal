import { memberHasProfile } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  if (!memberId) return Response.json({ hasProfile: false });
  return Response.json({ hasProfile: await memberHasProfile(memberId) });
}

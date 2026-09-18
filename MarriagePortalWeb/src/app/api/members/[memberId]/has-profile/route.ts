import { getMemberOwnProfileBrief } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  if (!memberId) return Response.json({ hasProfile: false, hasApprovedProfile: false, profileId: null, gender: null });
  const p = await getMemberOwnProfileBrief(memberId);
  // Viewing others is gated on having an approved (Verified/Active) profile of your own.
  const approved = !!p && (p.status === "Verified" || p.status === "Active");
  return Response.json({ hasProfile: !!p, hasApprovedProfile: approved, profileId: p?.id ?? null, gender: p?.gender ?? null });
}

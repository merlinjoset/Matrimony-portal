import type { NextRequest } from "next/server";
import { getContactReveal } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// The viewer is taken from the session cookie, never from the query string - so nobody can
// reveal a profile's number/photo by passing the owner's (or anyone's) memberId as the viewer.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  // Not signed in: return the locked (empty) reveal rather than an error, so the card renders.
  if (!g.ok) return Response.json({ isOwner: false, mobile: null, mobile2: null, mobileStatus: null, photoUrl: null, photoStatus: null });
  return Response.json(await getContactReveal(id, g.memberId));
}

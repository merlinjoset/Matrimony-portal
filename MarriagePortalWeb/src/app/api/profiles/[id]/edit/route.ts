import { getOwnProfile, updateProfile } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";
import type { UpdateProfileInput } from "@/lib/types";

export const dynamic = "force-dynamic";

// Load the owner's own listing (with the contact number and presbyter details they may edit).
// Ownership is proven by the session, not a memberId in the query - so you can only load YOUR own.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const profile = await getOwnProfile(id, g.memberId);
  if (!profile) return new Response("You can only edit your own profile.", { status: 403 });
  return Response.json(profile);
}

// Save the owner's edits. This re-enters the verification queue (see updateProfile).
// The owner is the session member; any memberId in the body is ignored.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  // The body may still carry a memberId (older clients) - it is ignored; ownership is the session.
  const dto = (await req.json()) as UpdateProfileInput;
  const res = await updateProfile(id, g.memberId, dto);
  if (!res.ok) return new Response(res.message ?? "Could not update this profile.", { status: res.status });
  return Response.json(res.profile);
}

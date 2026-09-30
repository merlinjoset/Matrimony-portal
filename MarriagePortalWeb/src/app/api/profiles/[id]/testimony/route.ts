import { getOwnProfile, setProfileTestimony } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// The owner (a committed member) loads their own success story to edit it.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const p = await getOwnProfile(id, g.memberId);
  if (!p) return new Response("You can only manage your own profile.", { status: 403 });
  return Response.json({
    status: p.status,
    testimony: p.testimony,
    testimonyVideoUrl: p.testimonyVideoUrl,
    marriageDate: p.marriageDate,
    testimonyStatus: p.testimonyStatus,
  });
}

// The owner updates their success story - only once the parish has marked the profile as committed.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const p = await getOwnProfile(id, g.memberId);
  if (!p) return new Response("You can only manage your own profile.", { status: 403 });
  if (p.status !== "Committed") {
    return new Response("Your success story can be added once your profile is marked as married.", { status: 409 });
  }
  const body = (await req.json()) as { testimony?: string | null; videoUrl?: string | null; marriageDate?: string | null };
  // A member's own submission always needs admin review before it appears publicly.
  const ok = await setProfileTestimony(id, body.testimony ?? null, body.videoUrl ?? null, body.marriageDate ?? null, "Pending");
  return ok ? new Response(null, { status: 204 }) : new Response("Profile not found.", { status: 404 });
}

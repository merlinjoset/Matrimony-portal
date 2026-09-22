import { getProfile, memberHasApprovedProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";
import { getMemberSession } from "@/lib/server/member-session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Members-only, and only members with an approved profile of their own may view others (mirrors
  // the client gate). Never expose profile data (email, family, salary, photo URL, ...) otherwise.
  // The member-facing page renders server-side; this API is used by the admin panel.
  const isAdmin = (await requireAdmin()).ok;
  if (!isAdmin) {
    const memberId = await getMemberSession();
    if (!memberId) return new Response("Please sign in to view profiles.", { status: 401 });
    if (!(await memberHasApprovedProfile(memberId))) {
      return new Response("Your profile must be approved before you can view others.", { status: 403 });
    }
  }

  const profile = await getProfile(id);
  if (!profile) return new Response("Profile not found.", { status: 404 });
  // Admins see everything. Signed-in members get the same view as the profile page: the contact
  // number, DOB, membership, presbyter and the photo URL stay hidden (the photo is revealed only
  // through the approval flow).
  return Response.json(
    isAdmin
      ? profile
      : {
          ...profile,
          membershipNo: null,
          mobile: null,
          mobile2: null,
          dateOfBirth: null,
          presbyterName: null,
          presbyterContact: null,
          refereeName: null,
          refereeContact: null,
          submitterDetails: null,
          mainPhotoUrl: null,
        },
  );
}

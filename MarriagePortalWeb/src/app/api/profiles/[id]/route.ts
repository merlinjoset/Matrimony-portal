import { getProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";
import { getMemberSession } from "@/lib/server/member-session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Members-only: never expose profile data (email, family, salary, photo URL, ...) to anonymous
  // callers. The member-facing page renders server-side; this API is used by the admin panel.
  const isAdmin = (await requireAdmin()).ok;
  const memberId = isAdmin ? null : await getMemberSession();
  if (!isAdmin && !memberId) return new Response("Please sign in to view profiles.", { status: 401 });

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

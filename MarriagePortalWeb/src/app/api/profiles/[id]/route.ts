import { getProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return new Response("Profile not found.", { status: 404 });
  // Contact number and presbyter details are admin-only here; members see the number only
  // through the approval flow and never see the presbyter contact.
  const isAdmin = (await requireAdmin()).ok;
  return Response.json(isAdmin ? profile : { ...profile, membershipNo: null, mobile: null, mobile2: null, dateOfBirth: null, presbyterName: null, presbyterContact: null, refereeName: null, refereeContact: null });
}

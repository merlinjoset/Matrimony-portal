import { getProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return new Response("Profile not found.", { status: 404 });
  // The contact number is admin-only here; members see it only through the approval flow.
  const isAdmin = (await requireAdmin()).ok;
  return Response.json(isAdmin ? profile : { ...profile, mobile: null });
}

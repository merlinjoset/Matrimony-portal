import { updateProfilePhoto } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Set the profile's main photo. Ownership is proven by the session, not a memberId in the body.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { mainPhotoUrl?: string | null };
  const ok = await updateProfilePhoto(id, g.memberId, body.mainPhotoUrl ?? null);
  return ok ? new Response(null, { status: 204 }) : new Response("You can only edit your own profile.", { status: 403 });
}

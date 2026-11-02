import { isStoredPhotoUrl, updateProfilePhoto } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Set the profile's main photo. Ownership is proven by the session, not a memberId in the body.
// The photo is mandatory, so this can replace it with another uploaded photo but never clear it.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { mainPhotoUrl?: string | null };
  if (!(await isStoredPhotoUrl(body.mainPhotoUrl))) {
    return new Response("A photo of the person being listed is required.", { status: 400 });
  }
  const ok = await updateProfilePhoto(id, g.memberId, body.mainPhotoUrl!.trim());
  return ok ? new Response(null, { status: 204 }) : new Response("You can only edit your own profile.", { status: 403 });
}

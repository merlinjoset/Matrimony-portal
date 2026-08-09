import { updateProfilePhoto } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { memberId?: string; mainPhotoUrl?: string | null };
  if (!body.memberId) return new Response("Sign in required.", { status: 401 });
  const ok = await updateProfilePhoto(id, body.memberId, body.mainPhotoUrl ?? null);
  return ok ? new Response(null, { status: 204 }) : new Response("You can only edit your own profile.", { status: 403 });
}

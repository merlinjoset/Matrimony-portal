import { getOwnProfile, updateProfile } from "@/lib/server/queries";
import type { UpdateProfileInput } from "@/lib/types";

export const dynamic = "force-dynamic";

// Load the owner's own listing (with the contact number and presbyter details they may edit).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memberId = new URL(req.url).searchParams.get("memberId");
  if (!memberId) return new Response("Sign in required.", { status: 401 });
  const profile = await getOwnProfile(id, memberId);
  if (!profile) return new Response("You can only edit your own profile.", { status: 403 });
  return Response.json(profile);
}

// Save the owner's edits. This re-enters the verification queue (see updateProfile).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { memberId?: string } & UpdateProfileInput;
  if (!body.memberId) return new Response("Sign in required.", { status: 401 });
  const { memberId, ...dto } = body;
  const res = await updateProfile(id, memberId, dto);
  if (!res.ok) return new Response(res.message ?? "Could not update this profile.", { status: res.status });
  return Response.json(res.profile);
}

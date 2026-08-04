import { getProfile } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  return profile ? Response.json(profile) : new Response("Profile not found.", { status: 404 });
}

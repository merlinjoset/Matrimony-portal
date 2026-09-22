import { getPhoto } from "@/lib/server/photos";
import { getMemberSession } from "@/lib/server/member-session";
import { getAdminSession } from "@/lib/server/admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Members/admins only, and never publicly cacheable - so profile photos cannot be fetched by
  // anonymous users or cached/indexed by CDNs and search engines from a leaked photo URL.
  const authed = (await getMemberSession()) || (await getAdminSession());
  if (!authed) return new Response("Please sign in to view photos.", { status: 401 });

  const { id } = await params;
  const photo = await getPhoto(id);
  if (!photo) return new Response("Not found.", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}

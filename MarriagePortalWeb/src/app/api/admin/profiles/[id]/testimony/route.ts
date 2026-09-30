import { setProfileTestimony, setTestimonyPublished } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const body = (await req.json()) as {
    testimony?: string | null;
    videoUrl?: string | null;
    marriageDate?: string | null;
    publish?: boolean;
    publishOnly?: boolean; // quick approve/unpublish without touching the content
  };
  const ok = body.publishOnly
    ? await setTestimonyPublished(id, !!body.publish)
    : await setProfileTestimony(id, body.testimony ?? null, body.videoUrl ?? null, body.marriageDate ?? null, body.publish ? "Published" : "Pending");
  return ok ? new Response(null, { status: 204 }) : new Response("Profile not found.", { status: 404 });
}

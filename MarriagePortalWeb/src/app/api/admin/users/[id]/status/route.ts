import { setAdminUserStatus } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { status: string };
  const ok = await setAdminUserStatus(id, body.status);
  return ok ? new Response(null, { status: 204 }) : new Response("Not found.", { status: 404 });
}

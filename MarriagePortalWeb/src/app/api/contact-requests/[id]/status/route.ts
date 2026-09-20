import { setContactRequestStatus } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { memberId?: string; status: string };
  if (!body.memberId) return new Response("Member is required.", { status: 400 });
  const res = await setContactRequestStatus(id, body.memberId, body.status);
  if (res.ok) return new Response(null, { status: 204 });
  return new Response(res.message ?? "Not found.", { status: res.status });
}

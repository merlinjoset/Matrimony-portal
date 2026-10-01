import { cancelOutgoingContactRequest } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Withdraw a request the caller sent. The acting member comes from the session, so nobody can
// cancel a request they did not send, and only one that is still awaiting a response.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const res = await cancelOutgoingContactRequest(id, g.memberId);
  if (res.ok) return new Response(null, { status: 204 });
  return new Response(res.message ?? "Not found.", { status: res.status });
}

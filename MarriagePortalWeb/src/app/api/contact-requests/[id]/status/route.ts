import { setContactRequestStatus } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Approve / decline / revoke a request. The acting owner is the session member, so nobody can
// change the status of a request addressed to someone else by passing that owner's memberId.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireMember();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { status: string };
  const res = await setContactRequestStatus(id, g.memberId, body.status);
  if (res.ok) return new Response(null, { status: 204 });
  return new Response(res.message ?? "Not found.", { status: res.status });
}

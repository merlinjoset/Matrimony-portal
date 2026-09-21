import { listOutgoingContactRequests } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Requests the caller has sent to others - resolved from the session, not the URL id.
export async function GET() {
  const g = await requireMember();
  if (!g.ok) return g.response;
  return Response.json(await listOutgoingContactRequests(g.memberId));
}

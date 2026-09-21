import { listIncomingContactRequests } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Requests other members have sent to the caller - resolved from the session, not the URL id.
export async function GET() {
  const g = await requireMember();
  if (!g.ok) return g.response;
  return Response.json(await listIncomingContactRequests(g.memberId));
}

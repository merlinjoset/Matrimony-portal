import { listInterestsReceived, listInterestsSent } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// The caller's Express Interests, received and sent (view only) - resolved from the session, not
// the URL id. Never includes the other family's phone number or message.
export async function GET() {
  const g = await requireMember();
  if (!g.ok) return g.response;
  const [received, sent] = await Promise.all([listInterestsReceived(g.memberId), listInterestsSent(g.memberId)]);
  return Response.json({ received, sent });
}

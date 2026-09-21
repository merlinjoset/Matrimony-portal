import { getMemberSelf } from "@/lib/server/queries";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// The caller's own name + contact number, resolved from the session (never from the URL id).
export async function GET() {
  const g = await requireMember();
  if (!g.ok) return g.response;
  return Response.json(await getMemberSelf(g.memberId));
}

import { getMemberOwnProfileBrief } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";

export const dynamic = "force-dynamic";

// The caller's own listing (for the "My profile" link), resolved from the session, not the URL id.
// Returns null (not 401) when not signed in so the nav degrades quietly.
export async function GET() {
  const memberId = await getMemberSession();
  if (!memberId) return Response.json(null);
  return Response.json(await getMemberOwnProfileBrief(memberId));
}

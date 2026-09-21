import { getMemberSession } from "@/lib/server/member-session";
import { getMemberSessionInfo } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

/**
 * The currently signed-in member, resolved from the session cookie (not from any URL id).
 * The client calls this on load to reconcile its stored session with the server: a 401 means
 * "not signed in here", so it clears any stale local session and prompts a fresh sign-in.
 */
export async function GET() {
  const unauthorized = () =>
    new Response(JSON.stringify({ message: "Not signed in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  const memberId = await getMemberSession();
  if (!memberId) return unauthorized();
  const info = await getMemberSessionInfo(memberId);
  if (!info) return unauthorized();
  return Response.json(info);
}

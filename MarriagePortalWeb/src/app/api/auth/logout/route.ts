import { buildMemberClearCookie } from "@/lib/server/member-session";

export const dynamic = "force-dynamic";

/** Sign a member out: clear the server-side session cookie. */
export async function POST() {
  return new Response(null, { status: 204, headers: { "Set-Cookie": buildMemberClearCookie() } });
}

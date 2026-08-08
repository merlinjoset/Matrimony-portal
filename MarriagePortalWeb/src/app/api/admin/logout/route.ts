import { buildClearCookie } from "@/lib/server/admin-session";

export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(null, { status: 204, headers: { "Set-Cookie": buildClearCookie() } });
}

import { adminLogin } from "@/lib/server/auth";
import { buildSetCookie } from "@/lib/server/admin-session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { email: string; password: string };
  const result = await adminLogin(body.email, body.password);
  if (!result.ok || !result.user) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify(result.user), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": buildSetCookie(result.user.id) },
  });
}

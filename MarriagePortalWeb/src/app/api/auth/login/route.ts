import { login } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { username?: string; password?: string };
  const result = await login(body.username ?? "", body.password ?? "");
  if (!result.ok) return new Response(result.message, { status: result.status });
  return Response.json(result.session);
}

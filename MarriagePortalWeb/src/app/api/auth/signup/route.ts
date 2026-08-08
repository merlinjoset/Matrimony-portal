import { signup } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { membershipNo?: string; username?: string; password?: string };
  const result = await signup(body.membershipNo ?? "", body.username ?? "", body.password ?? "");
  if (!result.ok) return new Response(result.message, { status: result.status });
  return Response.json({ message: result.message }, { status: result.status });
}

import { signup, signupGuest } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    membershipNo?: string;
    email?: string;
    emailToken?: string;
    username?: string;
    password?: string;
    name?: string;
  };
  const result = body.emailToken
    ? await signupGuest(body.email ?? "", body.emailToken, body.username ?? "", body.password ?? "", body.name)
    : await signup(body.membershipNo ?? "", body.username ?? "", body.password ?? "");
  if (!result.ok) return new Response(result.message, { status: result.status });
  return Response.json({ message: result.message }, { status: result.status });
}

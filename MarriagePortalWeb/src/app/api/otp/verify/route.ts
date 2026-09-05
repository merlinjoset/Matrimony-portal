import { verifyEmailOtp } from "@/lib/server/otp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; code?: string };
  const result = await verifyEmailOtp(body.email ?? "", body.code ?? "");
  if (!result.ok) return new Response(result.message, { status: 400 });
  return Response.json({ message: result.message, token: result.token });
}

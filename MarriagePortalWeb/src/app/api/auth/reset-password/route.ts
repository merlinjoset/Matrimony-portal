import { resetPasswordWithEmail } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    email?: string;
    emailToken?: string;
    newPassword?: string;
    scope?: "admin" | "member";
  };
  const result = await resetPasswordWithEmail(
    body.email ?? "",
    body.emailToken ?? "",
    body.newPassword ?? "",
    body.scope === "admin" ? "admin" : "member"
  );
  if (!result.ok) return new Response(result.message, { status: result.status });
  return Response.json({ message: result.message });
}

import { listMemberAccounts, adminCreateMemberAccount } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listMemberAccounts());
}

export async function POST(req: Request) {
  const body = (await req.json()) as { membershipNo: string; username: string; password: string };
  const result = await adminCreateMemberAccount(body.membershipNo, body.username, body.password);
  if (!result.ok) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 201 });
}

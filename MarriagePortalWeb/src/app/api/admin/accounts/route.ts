import { listMemberAccounts, adminCreateMemberAccount } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await listMemberAccounts());
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { membershipNo: string; username: string; password: string; email?: string };
  const result = await adminCreateMemberAccount(body.membershipNo, body.username, body.password, body.email);
  if (!result.ok) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 201 });
}

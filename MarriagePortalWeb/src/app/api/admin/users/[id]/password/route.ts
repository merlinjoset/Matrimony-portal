import { setAdminUserPassword } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const body = (await req.json()) as { password: string };
  const result = await setAdminUserPassword(id, body.password);
  if (!result.ok) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 204 });
}

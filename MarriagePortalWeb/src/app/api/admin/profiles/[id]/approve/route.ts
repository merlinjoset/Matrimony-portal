import { approveProfileLevel } from "@/lib/server/queries";
import { getAdminSession } from "@/lib/server/admin-session";
import { getAdminUserById } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { level: number; checklist?: string[] };

  const sessionId = await getAdminSession();
  const user = sessionId ? await getAdminUserById(sessionId) : null;
  // Bootstrap mode (no staff password set yet): act as Super Admin.
  const admin = user
    ? { id: user.id, name: user.name, role: user.role }
    : { id: "00000000-0000-0000-0000-000000000000", name: "Admin", role: "Super Admin" };

  const result = await approveProfileLevel(id, Number(body.level), admin, body.checklist);
  if (!result.ok) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 204 });
}

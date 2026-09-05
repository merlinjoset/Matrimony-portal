import { getApprovalChecklist, saveApprovalChecklist } from "@/lib/server/checklist";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

const CAN_EDIT = new Set(["Super Admin", "Diocese Admin"]);

export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await getApprovalChecklist());
}

export async function PUT(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  if (!CAN_EDIT.has(g.admin.role)) {
    return new Response("Only a Super Admin or Diocese Admin can edit the approval checklist.", { status: 403 });
  }
  const body = (await req.json()) as Record<string, string[]>;
  await saveApprovalChecklist(body as unknown as Record<number, string[]>);
  return new Response(null, { status: 204 });
}

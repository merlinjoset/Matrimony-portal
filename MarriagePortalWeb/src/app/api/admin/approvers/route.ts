import { getLevelAssignments, saveLevelAssignments } from "@/lib/server/approvers";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await getLevelAssignments());
}

export async function PUT(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  if (g.admin.role !== "Super Admin") {
    return new Response("Only a Super Admin can assign approvers.", { status: 403 });
  }
  const body = (await req.json()) as Record<string, string[]>;
  await saveLevelAssignments(body as unknown as Record<number, string[]>);
  return new Response(null, { status: 204 });
}

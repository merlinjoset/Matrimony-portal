import { approveProfileLevel, getProfile } from "@/lib/server/queries";
import { notifyLevelApprovers } from "@/lib/server/notifications";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const body = (await req.json()) as { level: number; checklist?: string[] };
  const level = Number(body.level);

  const result = await approveProfileLevel(id, level, g.admin, body.checklist);
  if (!result.ok) {
    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Hand off to the next level's approvers by email (levels 1 and 2 advance; level 3 is final).
  if (level < 3) {
    try {
      const profile = await getProfile(id);
      if (profile) await notifyLevelApprovers(profile, level + 1);
    } catch (err) {
      console.error("[approve] next-level notification failed:", err);
    }
  }

  return new Response(null, { status: 204 });
}

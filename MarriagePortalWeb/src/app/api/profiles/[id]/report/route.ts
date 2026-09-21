import { createReport } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { reason?: string; details?: string; reporterName?: string };
  if (!body.reason || !body.reason.trim()) return new Response("A reason is required.", { status: 400 });
  // Attribute the report to the signed-in member (if any) from the session, so a report cannot
  // be pinned on another member. Anonymous reports (no session) are still allowed.
  const reporterMemberId = await getMemberSession();
  const ok = await createReport({
    profileId: id,
    reporterMemberId: reporterMemberId,
    reporterName: body.reporterName ?? null,
    reason: body.reason.trim(),
    details: body.details?.trim() || null,
  });
  return ok ? new Response(null, { status: 201 }) : new Response("Profile not found.", { status: 404 });
}

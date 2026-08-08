import { createReport } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { reason?: string; details?: string; reporterMemberId?: string; reporterName?: string };
  if (!body.reason || !body.reason.trim()) return new Response("A reason is required.", { status: 400 });
  const ok = await createReport({
    profileId: id,
    reporterMemberId: body.reporterMemberId ?? null,
    reporterName: body.reporterName ?? null,
    reason: body.reason.trim(),
    details: body.details?.trim() || null,
  });
  return ok ? new Response(null, { status: 201 }) : new Response("Profile not found.", { status: 404 });
}

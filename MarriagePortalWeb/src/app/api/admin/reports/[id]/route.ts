import { resolveReport } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { action?: "dismiss" | "suspend" };
  if (body.action !== "dismiss" && body.action !== "suspend") return new Response("Invalid action.", { status: 400 });
  const ok = await resolveReport(id, body.action);
  return ok ? new Response(null, { status: 204 }) : new Response("Report not found.", { status: 404 });
}

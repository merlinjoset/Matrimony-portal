import { setProfileStatus } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const body = (await req.json()) as { status: string; note?: string | null };
  // A profile may become Verified ONLY through the 3-level approval flow (approveProfileLevel,
  // which sets it internally at Level 3). Block any direct shortcut to Verified via this route.
  if (body.status === "Verified") {
    return new Response(
      "A profile is verified only after all 3 approval levels are completed in the Verification Queue.",
      { status: 409 }
    );
  }
  const ok = await setProfileStatus(id, body.status, body.note);
  return ok ? new Response(null, { status: 204 }) : new Response("Profile not found.", { status: 404 });
}

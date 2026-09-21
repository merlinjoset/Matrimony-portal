import { requestContact, getProfileOwnerEmail } from "@/lib/server/queries";
import { notifyContactRequested } from "@/lib/server/notifications";
import { requireMember } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The requester is the signed-in member (from the session), so a request cannot be forged
  // to come from someone else.
  const g = await requireMember();
  if (!g.ok) return g.response;
  const body = (await req.json()) as { type?: "Contact" | "Photo" };
  const type = body.type === "Photo" ? "Photo" : "Contact";
  try {
    const created = await requestContact(id, g.memberId, type);
    // Notify the profile owner of a fresh pending request (never blocks the response).
    if (created.status === "Pending") {
      try {
        const to = await getProfileOwnerEmail(id);
        if (to) await notifyContactRequested(created, to);
      } catch (err) {
        console.error("[contact-requests] owner notification failed:", err);
      }
    }
    return Response.json(created);
  } catch (e) {
    const err = e as Error & { status?: number };
    return new Response(err.message, { status: err.status ?? 500 });
  }
}

import { requestContact, getProfileOwnerEmail } from "@/lib/server/queries";
import { notifyContactRequested } from "@/lib/server/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { requesterMemberId?: string };
  if (!body.requesterMemberId) return new Response("Please sign in with your membership card to request contact.", { status: 400 });
  try {
    const created = await requestContact(id, body.requesterMemberId);
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

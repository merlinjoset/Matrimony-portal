import { getAwaitingInterest, getProfileOwnerEmail, markInterestReminded } from "@/lib/server/queries";
import { sendInterestReminder } from "@/lib/server/notifications";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Admin-only: email the family of the listing an interest was sent to, reminding them that the
// parish office is waiting for their answer. Only for interests still Awaiting.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;

  const interest = await getAwaitingInterest(id);
  if (!interest) return new Response("This interest is no longer awaiting a reply.", { status: 404 });

  const to = await getProfileOwnerEmail(interest.toProfileId);
  if (!to) return new Response(`No email address is on file for ${interest.toReferenceId}. Please call or WhatsApp the family instead.`, { status: 409 });

  const sent = await sendInterestReminder(interest, to);
  if (!sent) return new Response("The email could not be sent. Please check Admin > Settings > Email.", { status: 502 });

  return Response.json(await markInterestReminded(id));
}

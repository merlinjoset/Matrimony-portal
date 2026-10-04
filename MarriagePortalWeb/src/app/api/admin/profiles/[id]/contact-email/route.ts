import { getProfile, getProfileOwnerEmail } from "@/lib/server/queries";
import { sendApplicantMessage } from "@/lib/server/notifications";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// The verifier emails the applicant from the verification screen (e.g. phone unreachable).
// The recipient is resolved from the profile server-side, so the message can only go to the
// applicant's own address on file - never an arbitrary one supplied by the client.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const body = (await req.json()) as { subject?: string; message?: string };
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!subject || !message) {
    return json({ message: "A subject and a message are both required." }, 400);
  }
  // Applicant's own email, else the on-behalf submitter's - matches what the verifier sees.
  let to = await getProfileOwnerEmail(id);
  if (!to) {
    const p = await getProfile(id);
    to = p?.submitterDetails?.email ?? null;
  }
  if (!to) {
    return json({ message: "No email address is on file for this applicant." }, 400);
  }
  const sent = await sendApplicantMessage(to, subject, message);
  if (!sent) {
    return json({ message: "The email could not be sent. Check the SMTP settings (Admin > Settings > Email)." }, 502);
  }
  return json({ to }, 200);
}

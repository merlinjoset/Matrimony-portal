import { findProfilesDueForReverify, markReverifyNotified } from "@/lib/server/queries";
import { notifyReverifyDue } from "@/lib/server/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Periodic job: email the parish office about listings that passed their 6-month re-verification date.
 * Safe to call daily - it only re-notifies a profile every 30 days until it is re-verified.
 *
 * Protect it by setting CRON_SECRET; then call with ?secret=... or an "x-cron-secret" header
 * (or Authorization: Bearer <secret>). If CRON_SECRET is unset the endpoint is open.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ||
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === secret;
}

async function run(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized.", { status: 401 });

  const due = await findProfilesDueForReverify();
  let emailed = false;
  if (due.length > 0) {
    emailed = await notifyReverifyDue(due);
    // Only stamp "notified" if the email actually went out, so a failed send retries next run.
    if (emailed) await markReverifyNotified(due.map((d) => d.id));
  }
  return Response.json({ due: due.length, emailed });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

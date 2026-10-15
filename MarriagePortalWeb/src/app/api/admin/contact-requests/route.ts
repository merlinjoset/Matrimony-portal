import { listAllContactRequests } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Admin-only oversight of members' contact-number / photo requests. Read-only: the profile owner
// approves or declines these themselves; the parish office only needs to see the activity.
export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await listAllContactRequests());
}

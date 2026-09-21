import { getStats } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  // Admin-only: the dashboard stats endpoint is consumed only by the admin home page.
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await getStats());
}

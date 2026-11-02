import { reactivateProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

// Admin: bring back a suspended or committed listing. Fully verified listings return to Verified;
// ones stopped mid-verification go back into the queue as Pending (see reactivateProfile).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const res = await reactivateProfile(id);
  return res.ok
    ? Response.json({ status: res.newStatus })
    : new Response(res.message ?? "Could not reactivate.", { status: res.status });
}

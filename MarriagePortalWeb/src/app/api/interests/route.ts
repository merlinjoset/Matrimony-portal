import { createInterest, listInterests } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";
import type { CreateInterestInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  // Admin-only: the interest list carries the sender's name and mobile number.
  // Only the parish office (admin/interests page) reads it; keep it off the public API.
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await listInterests());
}

export async function POST(req: Request) {
  const dto = (await req.json()) as CreateInterestInput;
  if (!dto.fromName || !dto.fromName.trim()) return new Response("Your name is required.", { status: 400 });
  if (!dto.fromMobile || !dto.fromMobile.trim()) return new Response("A contact number is required.", { status: 400 });
  const created = await createInterest(dto);
  return created ? Response.json(created) : new Response("Profile not found.", { status: 404 });
}

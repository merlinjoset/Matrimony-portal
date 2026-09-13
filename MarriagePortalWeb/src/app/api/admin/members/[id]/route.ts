import { adminGetProfileForEdit, adminUpdateProfile } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";
import type { UpdateProfileInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const p = await adminGetProfileForEdit(id);
  return p ? Response.json(p) : new Response("Not found.", { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const dto = (await req.json()) as UpdateProfileInput;
  const updated = await adminUpdateProfile(id, dto);
  return updated ? Response.json(updated) : new Response("Not found.", { status: 404 });
}

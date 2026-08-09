import { listAdminUsers, createAdminUser } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";
import type { CreateUserInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await listAdminUsers());
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const dto = (await req.json()) as CreateUserInput;
  const created = await createAdminUser(dto);
  if (!created) return new Response("A user with that email already exists.", { status: 409 });
  return Response.json(created, { status: 201 });
}

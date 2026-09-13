import { updateAdminUser } from "@/lib/server/queries";
import { requireAdmin } from "@/lib/server/guard";
import type { CreateUserInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  const { id } = await params;
  const dto = (await req.json()) as CreateUserInput;
  const res = await updateAdminUser(id, dto);
  if (res === "conflict") return new Response("A user with that email already exists.", { status: 409 });
  if (!res) return new Response("Not found.", { status: 404 });
  return Response.json(res);
}

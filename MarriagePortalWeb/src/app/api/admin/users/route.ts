import { createAdminUser, listAdminUsers } from "@/lib/server/queries";
import type { CreateUserInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listAdminUsers());
}

export async function POST(req: Request) {
  const dto = (await req.json()) as CreateUserInput;
  if (!dto.name || !dto.name.trim()) return new Response("Name is required.", { status: 400 });
  if (!dto.email || !dto.email.includes("@")) return new Response("A valid email is required.", { status: 400 });
  const created = await createAdminUser(dto);
  return created ? Response.json(created, { status: 201 }) : new Response("A user with that email already exists.", { status: 409 });
}

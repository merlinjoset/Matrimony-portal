import { resetMemberDevice } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await resetMemberDevice(id);
  return ok ? new Response(null, { status: 204 }) : new Response("Account not found.", { status: 404 });
}

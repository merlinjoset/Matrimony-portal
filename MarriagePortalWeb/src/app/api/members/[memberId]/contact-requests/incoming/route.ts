import { listIncomingContactRequests } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  return Response.json(await listIncomingContactRequests(memberId));
}

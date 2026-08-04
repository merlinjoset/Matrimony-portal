import { requestContact } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { requesterMemberId?: string };
  if (!body.requesterMemberId) return new Response("Please sign in with your membership card to request contact.", { status: 400 });
  try {
    const created = await requestContact(id, body.requesterMemberId);
    return Response.json(created);
  } catch (e) {
    const err = e as Error & { status?: number };
    return new Response(err.message, { status: err.status ?? 500 });
  }
}

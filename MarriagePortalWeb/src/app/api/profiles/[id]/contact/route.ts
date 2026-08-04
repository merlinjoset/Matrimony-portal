import type { NextRequest } from "next/server";
import { getContactReveal } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewerMemberId = req.nextUrl.searchParams.get("viewerMemberId") ?? "";
  if (!viewerMemberId) return Response.json({ status: null, mobile: null, isOwner: false });
  return Response.json(await getContactReveal(id, viewerMemberId));
}

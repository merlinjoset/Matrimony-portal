import type { NextRequest } from "next/server";
import { validateMembership } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const membershipNo = req.nextUrl.searchParams.get("membershipNo") ?? "";
  return Response.json(await validateMembership(membershipNo));
}

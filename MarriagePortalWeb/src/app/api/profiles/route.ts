import type { NextRequest } from "next/server";
import { browseProfiles, createProfile, validateMembership } from "@/lib/server/queries";
import { notifyNewProfile } from "@/lib/server/notifications";
import type { CreateProfileInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const num = (v: string | null) => (v ? Number(v) : undefined);
  const result = await browseProfiles({
    gender: p.get("gender") ?? undefined,
    denomination: p.get("denomination") ?? undefined,
    congregation: p.get("congregation") ?? undefined,
    status: p.get("status") ?? undefined,
    live: p.get("live") === "true",
    page: num(p.get("page")),
    pageSize: num(p.get("pageSize")),
  });
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  const dto = (await req.json()) as CreateProfileInput;
  if (!dto.fullName || !dto.fullName.trim()) return new Response("Full name is required.", { status: 400 });

  const membership = await validateMembership(dto.membershipNo ?? "");
  if (!membership.valid) return new Response(membership.message ?? "Invalid membership card.", { status: 400 });

  const created = await createProfile(dto, membership.memberId);

  // Notify the parish office that a profile is awaiting verification (never blocks the response).
  try {
    await notifyNewProfile(created, dto.mobile ?? null);
  } catch (err) {
    console.error("[profiles] notification failed:", err);
  }

  return Response.json(created, { status: 201 });
}

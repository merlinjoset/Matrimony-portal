import type { NextRequest } from "next/server";
import { browseProfiles, createProfile, validateMembership } from "@/lib/server/queries";
import { guestMemberId, verifyEmailToken } from "@/lib/server/otp";
import { notifyLevelApprovers, notifyNewProfile } from "@/lib/server/notifications";
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

  // Age gate: a listing's subject must be at least 21 (mirrors the client-side rule).
  if (!dto.dateOfBirth) return new Response("Date of birth is required.", { status: 400 });
  const dob = new Date(dto.dateOfBirth);
  if (isNaN(dob.getTime())) return new Response("Invalid date of birth.", { status: 400 });
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const mm = now.getMonth() - dob.getMonth();
  if (mm < 0 || (mm === 0 && now.getDate() < dob.getDate())) age--;
  if (age < 21) return new Response("The person must be at least 21 years old.", { status: 400 });

  // Identity is proven by EITHER a valid parish membership card OR a verified-email token (non-members).
  let ownerMemberId: string | null;
  if (dto.emailToken) {
    const v = verifyEmailToken(dto.emailToken);
    if (!v.valid || !v.email) return new Response("Email verification expired. Please verify your email again.", { status: 400 });
    ownerMemberId = guestMemberId(v.email);
  } else {
    const membership = await validateMembership(dto.membershipNo ?? "");
    if (!membership.valid) return new Response(membership.message ?? "Invalid membership card.", { status: 400 });
    ownerMemberId = membership.memberId;
  }

  const created = await createProfile(dto, ownerMemberId);

  // Notify the parish office, and email the Level 1 approvers to start the review (never blocks the response).
  try {
    await notifyNewProfile(created, dto.mobile ?? null);
    await notifyLevelApprovers(created, 1);
  } catch (err) {
    console.error("[profiles] notification failed:", err);
  }

  return Response.json(created, { status: 201 });
}

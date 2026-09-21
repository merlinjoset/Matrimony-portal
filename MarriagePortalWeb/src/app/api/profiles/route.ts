import type { NextRequest } from "next/server";
import { browseProfiles, createProfile, memberHasProfile, validateMembership } from "@/lib/server/queries";
import { guestMemberId, verifyEmailToken } from "@/lib/server/otp";
import { activateMemberAccountByMemberId } from "@/lib/server/auth";
import { notifyLevelApprovers, notifyNewProfile } from "@/lib/server/notifications";
import { requireAdmin } from "@/lib/server/guard";
import type { CreateProfileInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // This list endpoint is admin-only. The public browse page renders server-side (it calls
  // browseProfiles directly), so this must not be an open API that anyone can scrape/download.
  const g = await requireAdmin();
  if (!g.ok) return g.response;
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
    includePhotos: true,
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

  if (!dto.caste || !dto.caste.trim()) return new Response("Caste is required (or choose 'Caste no bar').", { status: 400 });
  if (!dto.nativePlace || !dto.nativePlace.trim()) return new Response("Native place is required.", { status: 400 });

  // When someone submits a profile on behalf of the bride/groom (createdFor != "Self"), the
  // "Details of the Person Submitting the Form" consent is mandatory - enforce it server-side too.
  if ((dto.createdFor ?? "Self") !== "Self") {
    const sd = dto.submitterDetails;
    const filled = (v?: string | null) => !!(v && v.trim());
    const ok =
      !!sd &&
      filled(sd.relationship) &&
      (sd.relationship !== "Other" || filled(sd.relationshipOther)) &&
      filled(sd.name) &&
      filled(sd.mobile) &&
      filled(sd.email) &&
      filled(sd.country) &&
      filled(sd.city) &&
      filled(sd.churchMembership) &&
      filled(sd.preferredContact) &&
      sd.declaration === true &&
      sd.consent === true;
    if (!ok) {
      return new Response(
        "Please complete and agree to the submitter consent form (required when registering on behalf of someone else).",
        { status: 400 },
      );
    }
  }

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

  // One profile per member: block a duplicate instead of creating a second listing for the same owner.
  // (Editing an existing profile goes through PATCH /profiles/[id]/edit, so this never blocks edits.)
  if (ownerMemberId && (await memberHasProfile(ownerMemberId))) {
    return new Response(
      "A profile already exists for this membership. Please sign in and edit your existing profile instead of creating a new one. If you cannot sign in, please contact the parish office.",
      { status: 409 },
    );
  }

  const created = await createProfile(dto, ownerMemberId);

  // Activate the owner's login account so they can sign in and manage their profile (never blocks).
  if (ownerMemberId) {
    try {
      await activateMemberAccountByMemberId(ownerMemberId);
    } catch (err) {
      console.error("[profiles] account activation failed:", err);
    }
  }

  // Notify the parish office, and email the Level 1 approvers to start the review (never blocks the response).
  try {
    await notifyNewProfile(created, dto.mobile ?? null);
    await notifyLevelApprovers(created, 1);
  } catch (err) {
    console.error("[profiles] notification failed:", err);
  }

  return Response.json(created, { status: 201 });
}

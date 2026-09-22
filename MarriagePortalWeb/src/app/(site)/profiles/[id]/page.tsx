import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/profile-detail-view";
import { MemberGate } from "@/components/member-gate";
import { getProfile, memberHasApprovedProfile } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Members-only, and only members with an approved profile of their own may view others (the
  // owner may always view their own listing). Never fetch or ship profile PII to anyone else -
  // the payload of this server-rendered page must not carry it. Others get the members-only gate.
  const isAdmin = (await requireAdmin()).ok;
  const memberId = isAdmin ? null : await getMemberSession();
  if (!isAdmin && !memberId) {
    return <MemberGate requireProfile>{null}</MemberGate>;
  }

  const p = await getProfile(id);
  if (!p) notFound();

  if (!isAdmin) {
    const isOwner = p.ownerMemberId === memberId;
    const canView = isOwner || (await memberHasApprovedProfile(memberId!));
    if (!canView) {
      // Signed-in member without an approved profile, viewing someone else - show the gate, no data.
      return <MemberGate requireProfile>{null}</MemberGate>;
    }
  }
  // The photo is private: never send the URL in the page payload. The client reveals it
  // through the contact/photo request flow (getContact) once the owner approves.
  const hasPhoto = !!p.mainPhotoUrl;
  // Photo, contact number and presbyter details are private on the member-facing page - never
  // ship them in the payload (the photo/number are revealed only via the approval flow).
  return <ProfileDetailView p={{ ...p, mainPhotoUrl: null, membershipNo: null, mobile: null, mobile2: null, dateOfBirth: null, presbyterName: null, presbyterContact: null, refereeName: null, refereeContact: null, submitterDetails: null }} hasPhoto={hasPhoto} />;
}

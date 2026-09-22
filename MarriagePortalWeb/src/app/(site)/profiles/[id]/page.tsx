import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/profile-detail-view";
import { MemberGate } from "@/components/member-gate";
import { getProfile } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";
import { requireAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Members-only: do not fetch or ship any profile data to anonymous users (this page is
  // server-rendered, so the payload itself must not carry PII). Signed-in members and admins get
  // the profile; everyone else gets the members-only gate with nothing in the HTML.
  const isAdmin = (await requireAdmin()).ok;
  const memberId = isAdmin ? null : await getMemberSession();
  if (!isAdmin && !memberId) {
    return <MemberGate requireProfile>{null}</MemberGate>;
  }

  const p = await getProfile(id);
  if (!p) notFound();
  // The photo is private: never send the URL in the page payload. The client reveals it
  // through the contact/photo request flow (getContact) once the owner approves.
  const hasPhoto = !!p.mainPhotoUrl;
  // Photo, contact number and presbyter details are private on the member-facing page - never
  // ship them in the payload (the photo/number are revealed only via the approval flow).
  return <ProfileDetailView p={{ ...p, mainPhotoUrl: null, membershipNo: null, mobile: null, mobile2: null, dateOfBirth: null, presbyterName: null, presbyterContact: null, refereeName: null, refereeContact: null, submitterDetails: null }} hasPhoto={hasPhoto} />;
}

import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/profile-detail-view";
import { getProfile } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProfile(id);
  if (!p) notFound();
  // The photo is private: never send the URL in the page payload. The client reveals it
  // through the contact/photo request flow (getContact) once the owner approves.
  const hasPhoto = !!p.mainPhotoUrl;
  return <ProfileDetailView p={{ ...p, mainPhotoUrl: null }} hasPhoto={hasPhoto} />;
}

import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/profile-detail-view";
import { getProfile } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProfile(id);
  if (!p) notFound();
  return <ProfileDetailView p={p} />;
}

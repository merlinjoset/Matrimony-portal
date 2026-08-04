import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/profile-detail-view";
import { api, ApiError } from "@/lib/api";
import type { ProfileDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let p: ProfileDetail;
  try {
    p = await api.getProfile(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  return <ProfileDetailView p={p} />;
}

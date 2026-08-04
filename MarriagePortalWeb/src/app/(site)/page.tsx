import { Suspense } from "react";
import { ProfileCard } from "@/components/profile-card";
import { ProfileGridSkeleton } from "@/components/profile-card-skeleton";
import {
  HomeHero,
  ScriptureBand,
  FeaturesSection,
  FeaturedSection,
} from "@/components/home/home-sections";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

async function FeaturedProfiles() {
  let items;
  try {
    items = (await api.browseProfiles({ pageSize: 3, live: true })).items;
  } catch {
    return (
      <p className="text-center text-muted-foreground">
        Could not reach the API. Make sure the backend is running at{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">http://localhost:5117</code>.
      </p>
    );
  }
  if (items.length === 0) return <p className="text-center text-muted-foreground">No profiles yet.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <ProfileCard key={p.id} p={p} index={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ScriptureBand />
      <FeaturesSection />
      <FeaturedSection>
        <Suspense fallback={<ProfileGridSkeleton count={3} />}>
          <FeaturedProfiles />
        </Suspense>
      </FeaturedSection>
    </>
  );
}

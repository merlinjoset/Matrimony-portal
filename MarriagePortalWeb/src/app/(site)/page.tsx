import { Suspense } from "react";
import { ProfileCard } from "@/components/profile-card";
import { ProfileGridSkeleton } from "@/components/profile-card-skeleton";
import {
  HomeHero,
  DisclaimerBand,
  FeaturesSection,
  FeaturedSection,
} from "@/components/home/home-sections";
import { browseProfiles, memberHasApprovedProfile } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";

export const dynamic = "force-dynamic";

async function FeaturedProfiles() {
  // Members-only, and only once your own profile is approved (matches browsing). Logged-out
  // visitors never reach this (the section is hidden client-side), so this covers signed-in
  // members whose profile is still pending - no real profiles are rendered for them.
  const memberId = await getMemberSession();
  const canBrowse = !!memberId && (await memberHasApprovedProfile(memberId));
  if (!canBrowse) {
    return (
      <p className="text-center text-muted-foreground">
        Profiles appear here once your membership profile is approved.
      </p>
    );
  }
  let items;
  try {
    items = (await browseProfiles({ pageSize: 3, live: true })).items;
  } catch {
    return (
      <p className="text-center text-muted-foreground">Could not load profiles right now. Please refresh.</p>
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
      <DisclaimerBand />
      <FeaturesSection />
      <FeaturedSection>
        <Suspense fallback={<ProfileGridSkeleton count={3} />}>
          <FeaturedProfiles />
        </Suspense>
      </FeaturedSection>
    </>
  );
}

import { BrowseView } from "@/components/browse-view";
import { browseProfiles, memberHasApprovedProfile } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";
import type { ProfileListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  // Members-only, and only members with an approved profile of their own may browse others (same
  // rule as the client gate). Otherwise nothing is fetched or rendered into the HTML - BrowseView
  // shows the appropriate sign-in / "profile pending" gate - so names and IDs never leak.
  const memberId = await getMemberSession();
  const canBrowse = !!memberId && (await memberHasApprovedProfile(memberId));

  let items: ProfileListItem[] = [];
  let total = 0;
  let error = false;
  if (canBrowse) {
    try {
      const res = await browseProfiles({
        gender: sp.gender,
        denomination: sp.denomination,
        congregation: sp.congregation,
        live: true, // only Verified/Active profiles
        page: sp.page ? Number(sp.page) : 1,
      });
      items = res.items;
      total = res.total;
    } catch {
      error = true;
    }
  }

  return <BrowseView items={items} total={total} error={error} />;
}

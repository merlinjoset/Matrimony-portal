import { BrowseView } from "@/components/browse-view";
import { browseProfiles, getMemberOwnProfileBrief, memberHasApprovedProfile } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";
import type { ProfileListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

// Large enough that today's whole list fits on one page; Previous/Next appear once it grows past this.
const PAGE_SIZE = 48;

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
  let page = 1;
  let error = false;
  if (canBrowse) {
    try {
      // A groom sees brides and a bride sees grooms, never their own listing. Both rules are applied
      // in the query (not by filtering one page in the browser), so the count and the pages cover
      // every matching profile.
      const own = await getMemberOwnProfileBrief(memberId);
      const gender = own?.gender === "Male" ? "Female" : own?.gender === "Female" ? "Male" : undefined;
      const requested = Number(sp.page);
      const res = await browseProfiles({
        gender,
        denomination: sp.denomination,
        congregation: sp.congregation,
        live: true, // only Verified/Active profiles
        excludeOwnerMemberId: memberId,
        page: Number.isInteger(requested) && requested > 0 ? requested : 1,
        pageSize: PAGE_SIZE,
      });
      items = res.items;
      total = res.total;
      page = res.page;
    } catch {
      error = true;
    }
  }

  return <BrowseView items={items} total={total} page={page} pageSize={PAGE_SIZE} error={error} />;
}

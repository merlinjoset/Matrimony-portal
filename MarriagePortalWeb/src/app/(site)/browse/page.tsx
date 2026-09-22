import { BrowseView } from "@/components/browse-view";
import { browseProfiles } from "@/lib/server/queries";
import { getMemberSession } from "@/lib/server/member-session";
import type { ProfileListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  // Members-only: only fetch and ship profile data when a member is signed in (verified
  // server-side). For anonymous visitors nothing is rendered into the HTML - BrowseView shows the
  // sign-in gate - so names and IDs never leak in the SSR payload.
  const memberId = await getMemberSession();

  let items: ProfileListItem[] = [];
  let total = 0;
  let error = false;
  if (memberId) {
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

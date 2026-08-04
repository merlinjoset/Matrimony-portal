import { BrowseView } from "@/components/browse-view";
import { browseProfiles } from "@/lib/server/queries";
import type { ProfileListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  let items: ProfileListItem[] = [];
  let total = 0;
  let error = false;
  try {
    const res = await browseProfiles({
      gender: sp.gender,
      denomination: sp.denomination,
      congregation: sp.congregation,
      live: true, // public listing - only Verified/Active profiles
      page: sp.page ? Number(sp.page) : 1,
    });
    items = res.items;
    total = res.total;
  } catch {
    error = true;
  }

  return <BrowseView items={items} total={total} error={error} />;
}

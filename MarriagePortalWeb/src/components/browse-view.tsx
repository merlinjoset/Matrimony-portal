"use client";

import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile-card";
import { BrowseFilters } from "@/components/browse-filters";
import { MemberGate } from "@/components/member-gate";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import type { ProfileListItem } from "@/lib/types";

export function BrowseView(props: { items: ProfileListItem[]; total: number; error: boolean }) {
  return (
    <MemberGate requireProfile>
      <BrowseContent {...props} />
    </MemberGate>
  );
}

function BrowseContent({
  items,
  total,
  error,
}: {
  items: ProfileListItem[];
  total: number;
  error: boolean;
}) {
  const { t } = useT();
  const { member } = useMemberShortlist();
  // A member only sees the opposite gender (a groom sees brides, a bride sees grooms).
  const [myGender, setMyGender] = useState<string | null>(null);
  useEffect(() => {
    if (!member) { setMyGender(null); return; }
    api.hasProfile(member.memberId).then((r) => setMyGender(r.gender)).catch(() => {});
  }, [member]);
  const targetGender = myGender === "Male" ? "Female" : myGender === "Female" ? "Male" : null;

  const visible = items.filter(
    (p) =>
      (!member || p.ownerMemberId !== member.memberId) && // never show the viewer their own listing
      (!targetGender || p.gender === targetGender),        // only the opposite gender
  );
  const count = visible.length;
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("browse_h")}</h2>
          <span className="text-sm text-muted-foreground">
            {error ? "" : `${count} ${count === 1 ? t("result_found") : t("results_found")}`}
          </span>
        </div>
        <div className="ml-auto">
          <BrowseFilters />
        </div>
      </div>

      {error ? (
        <p className="text-muted-foreground">{t("api_down")}</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">{t("no_match")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <ProfileCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

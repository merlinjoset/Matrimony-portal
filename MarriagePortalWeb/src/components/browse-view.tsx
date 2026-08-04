"use client";

import { ProfileCard } from "@/components/profile-card";
import { BrowseFilters } from "@/components/browse-filters";
import { useT } from "@/lib/i18n";
import type { ProfileListItem } from "@/lib/types";

export function BrowseView({
  items,
  total,
  error,
}: {
  items: ProfileListItem[];
  total: number;
  error: boolean;
}) {
  const { t } = useT();
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("browse_h")}</h2>
          <span className="text-sm text-muted-foreground">
            {error ? "" : `${total} ${total === 1 ? t("result_found") : t("results_found")}`}
          </span>
        </div>
        <div className="ml-auto">
          <BrowseFilters />
        </div>
      </div>

      {error ? (
        <p className="text-muted-foreground">{t("api_down")}</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">{t("no_match")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <ProfileCard key={p.id} p={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

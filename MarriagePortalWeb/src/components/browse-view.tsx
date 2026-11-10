"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProfileCard } from "@/components/profile-card";
import { BrowseFilters } from "@/components/browse-filters";
import { MemberGate } from "@/components/member-gate";
import { useT } from "@/lib/i18n";
import type { ProfileListItem } from "@/lib/types";

type Props = { items: ProfileListItem[]; total: number; page: number; pageSize: number; error: boolean };

export function BrowseView(props: Props) {
  return (
    <MemberGate requireProfile>
      <BrowseContent {...props} />
    </MemberGate>
  );
}

// The server already limits the list to the opposite gender and leaves out the viewer's own
// listing, so `total` is the real number of matching profiles and `items` is one page of them.
function BrowseContent({ items, total, page, pageSize, error }: Props) {
  const { t } = useT();
  const sp = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const hrefFor = (n: number) => {
    const params = new URLSearchParams(sp.toString());
    if (n <= 1) params.delete("page");
    else params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/browse?${qs}` : "/browse";
  };

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

      {!error && pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className="rounded-lg border border-border bg-background px-3.5 py-2 font-medium hover:bg-muted">
              {t("pager_prev")}
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-3.5 py-2 font-medium text-muted-foreground/50">{t("pager_prev")}</span>
          )}
          <span className="text-muted-foreground">
            {t("pager_page")} {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={hrefFor(page + 1)} className="rounded-lg border border-border bg-background px-3.5 py-2 font-medium hover:bg-muted">
              {t("pager_next")}
            </Link>
          ) : (
            <span className="rounded-lg border border-border px-3.5 py-2 font-medium text-muted-foreground/50">{t("pager_next")}</span>
          )}
        </nav>
      )}
    </section>
  );
}

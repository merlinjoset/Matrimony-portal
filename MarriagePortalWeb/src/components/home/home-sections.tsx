"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/hero-search";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";

export function HomeHero() {
  const { t } = useT();
  const { member } = useMemberShortlist();
  return (
    <section className="border-b border-border bg-gradient-to-b from-white to-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <span className="mb-4 inline-block rounded-full border border-brand-green/25 bg-brand-green/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-brand-green">
            {t("hero_verse")}
          </span>
          <h1 className="text-4xl font-bold leading-tight md:text-[42px]">
            {t("hero_title_a")}
            <span className="text-maroon">{t("hero_title_em")}</span>
            {t("hero_title_b")}
          </h1>
          <p className="mt-4 max-w-lg text-[17px] text-muted-foreground">{t("hero_lead")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<Link href="/register" />} nativeButton={false} size="lg" className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
              {t("register_free")}
            </Button>
            {member ? (
              <Button render={<Link href="/browse" />} nativeButton={false} size="lg" variant="outline">
                {t("nav_browse")}
              </Button>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-7">
            <Stat n="3" label={t("stat_congregations")} />
          </div>

          <p className="mt-6 text-[12.5px] font-semibold uppercase tracking-wider text-maroon/70">
            {t("private_circ")}
          </p>
        </div>

        <HeroSearch />
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-maroon">{n}</div>
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
    </div>
  );
}

export function DisclaimerBand() {
  return (
    <section className="bg-gradient-to-b from-maroon to-maroon-2 py-12 text-white">
      <div className="mx-auto max-w-4xl px-5">
        <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-wide text-gold">
          Church Matrimonial Portal Disclaimer
        </h2>
        <div className="space-y-3 text-[13.5px] leading-relaxed text-white/90">
          <p>
            This Matrimonial Portal is provided solely as a facilitation service for members seeking suitable matrimonial
            alliances. The Church acts only as a platform provider in listing.
          </p>
          <p>
            The Church does not guarantee the accuracy, completeness, character, compatibility, suitability, financial
            status, educational qualifications, family background, or intentions of any individual registered on the portal.
          </p>
          <p>
            Any communication, meeting, engagement, marriage proposal, or matrimonial decision arising from interactions on
            this portal is entirely the responsibility of the individuals and families involved.
          </p>
          <p>Users are advised to independently verify all information before making any commitment or decision.</p>
          <p>
            The Church, its Chairman, staff, committee members, and volunteers shall not be held liable for any disputes,
            misunderstandings, financial loss, emotional distress, legal claims, or consequences arising from the use of this
            service.
          </p>
          <p>
            By registering on this portal, users acknowledge and agree that all matrimonial decisions are made voluntarily
            and independently by the concerned parties.
          </p>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const { t } = useT();
  const features = [
    { ic: "✝", t: "f1t", d: "f1d" },
    { ic: "🔒", t: "f3t", d: "f3d" },
    { ic: "🤝", t: "f4t", d: "f4d" },
    { ic: "🌍", t: "f5t", d: "f5d" },
    { ic: "⛪", t: "f6t", d: "f6d" },
  ];
  return (
    <section className="py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto mb-9 text-center">
          <div className="mx-auto mb-3.5 h-[3px] rounded bg-gold" style={{ width: 60 }} />
          <h2 className="text-3xl font-bold">{t("feat_h")}</h2>
          <p className="mx-auto mt-1 max-w-xl text-muted-foreground">{t("feat_sub")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-border bg-white p-6 text-center">
              <div className="mb-2.5 text-3xl">{f.ic}</div>
              <h4 className="mb-1.5 text-[17px] font-semibold">{t(f.t)}</h4>
              <p className="text-sm text-muted-foreground">{t(f.d)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedSection({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { member } = useMemberShortlist();
  // Recently-joined profiles are members-only - hidden until signed in.
  if (!member) return null;
  return (
    <section className="border-t border-border bg-white py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto mb-9 text-center">
          <div className="mx-auto mb-3.5 h-[3px] rounded bg-gold" style={{ width: 60 }} />
          <h2 className="text-3xl font-bold">{t("recent_h")}</h2>
          <p className="mt-1 text-muted-foreground">{t("recent_sub")}</p>
        </div>
        {children}
        <div className="mt-8 text-center">
          <Button render={<Link href="/browse" />} nativeButton={false} variant="outline">
            {t("view_all")}
          </Button>
        </div>
      </div>
    </section>
  );
}

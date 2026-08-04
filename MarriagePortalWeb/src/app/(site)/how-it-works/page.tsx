"use client";

import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

export default function HowItWorksPage() {
  const { t } = useT();
  const steps = [
    { n: 1, t: "s1t", d: "s1d" },
    { n: 2, t: "s2t", d: "s2d" },
    { n: 3, t: "s3t", d: "s3d" },
    { n: 4, t: "s4t", d: "s4d" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <div className="mx-auto mb-10 text-center">
        <div className="mx-auto mb-3.5 h-[3px] rounded bg-gold" style={{ width: 60 }} />
        <h1 className="text-3xl font-bold">{t("how_h")}</h1>
        <p className="mx-auto mt-1 max-w-xl text-muted-foreground">{t("how_sub")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <Card key={s.n} className="p-6 text-center">
            <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-maroon text-lg font-bold text-white">
              {s.n}
            </div>
            <h4 className="mb-1.5 font-semibold">{t(s.t)}</h4>
            <p className="text-sm text-muted-foreground">{t(s.d)}</p>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-3.5 text-sm text-brand-green">
          🕊️ {t("promise")}
        </div>
      </div>
    </section>
  );
}

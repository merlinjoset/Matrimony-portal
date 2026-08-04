"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";

const gradients = [
  "from-[#6b1f2a] to-[#3f6b54]",
  "from-[#8a2a38] to-[#9c6b1f]",
  "from-[#3f6b54] to-[#4a5d7a]",
  "from-[#9c6b1f] to-[#7a3f6b]",
];
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function ShortlistPage() {
  const { t } = useT();
  const { items, ready, remove, member, openSignIn } = useMemberShortlist();

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("sl_h")}</h1>
        <p className="text-sm text-muted-foreground">
          {member ? `${t("sl_sub")} (${t("signed_in_as")}: ${member.name})` : t("sl_sub")}
        </p>
      </div>

      {!ready ? null : !member ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="max-w-sm text-muted-foreground">{t("sl_signin_prompt")}</p>
          <Button onClick={openSignIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
            {t("signin_btn")}
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">{t("sl_empty")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Card key={p.id} className="overflow-hidden p-0 gap-0">
              <Link href={`/profiles/${p.id}`}>
                <div className={`grid h-40 place-items-center overflow-hidden bg-gradient-to-br ${gradients[i % gradients.length]} text-5xl font-bold text-white`}>
                  {p.mainPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.mainPhotoUrl} alt={p.fullName} className="h-full w-full object-cover" />
                  ) : (
                    initials(p.fullName)
                  )}
                </div>
              </Link>
              <div className="p-4">
                <h4 className="text-[17px] font-semibold">
                  {p.fullName} <span className="text-[13px] font-normal text-muted-foreground">· {p.referenceId}</span>
                </h4>
                <div className="mb-3 text-[13px] text-muted-foreground">
                  {[p.age ? `${p.age} ${t("yrs")}` : null, t(p.gender === "Female" ? "bride" : "groom"), p.denomination, p.congregation]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <div className="flex gap-2">
                  <Button render={<Link href={`/profiles/${p.id}`} />} nativeButton={false} size="sm" variant="outline">
                    {t("sl_view")}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5" onClick={() => remove(p.id)}>
                    {t("sl_remove")}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfileListItem } from "@/lib/types";
import { useT } from "@/lib/i18n";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const gradients = [
  "from-[#6b1f2a] to-[#3f6b54]",
  "from-[#8a2a38] to-[#9c6b1f]",
  "from-[#3f6b54] to-[#4a5d7a]",
  "from-[#9c6b1f] to-[#7a3f6b]",
];

export function ProfileCard({ p, index = 0 }: { p: ProfileListItem; index?: number }) {
  const { t } = useT();
  return (
    <Link href={`/profiles/${p.id}`}>
      <Card className="overflow-hidden p-0 pt-0 transition hover:-translate-y-1 hover:border-gold hover:shadow-lg gap-0">
        <div className={`relative grid h-44 place-items-center bg-gradient-to-br ${gradients[index % gradients.length]} text-5xl font-bold text-white`}>
          {p.mainPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.mainPhotoUrl} alt={p.fullName} className="h-full w-full object-cover" />
          ) : (
            initials(p.fullName)
          )}
          {(p.status === "Verified" || p.status === "Active") && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-brand-green/95 px-2.5 py-1 text-[11px] font-bold text-white">
              {t("verified_badge")}
            </span>
          )}
        </div>
        <div className="p-4">
          <h4 className="text-[17px] font-semibold">
            {p.fullName}{" "}
            <span className="text-[13px] font-normal text-muted-foreground">· {p.referenceId}</span>
          </h4>
          <div className="mb-2.5 text-[13px] text-muted-foreground">
            {[p.age ? `${p.age} ${t("yrs")}` : null, p.height, t(p.gender === "Female" ? "bride" : "groom"), p.city]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-maroon/15 bg-maroon/5 text-maroon">
              ⛪ {p.denomination}
            </Badge>
            {p.profession && <Badge variant="secondary">{p.profession}</Badge>}
            <Badge variant="outline">{p.congregation}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

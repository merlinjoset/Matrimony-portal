"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMemberShortlist } from "@/lib/member-shortlist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useT } from "@/lib/i18n";
import { CONGREGATIONS, DENOMINATIONS } from "@/lib/types";

export function HeroSearch() {
  const { t } = useT();
  const router = useRouter();
  const { member, openSignIn } = useMemberShortlist();
  const [gender, setGender] = useState("Female");
  const [denom, setDenom] = useState<string[]>([]);
  const [cong, setCong] = useState<string[]>([]);

  function search() {
    const p = new URLSearchParams();
    p.set("gender", gender);
    if (denom.length) p.set("denomination", denom.join(","));
    if (cong.length) p.set("congregation", cong.join(","));
    router.push(`/browse?${p.toString()}`);
  }

  const ages = ["21", "24", "27", "30", "34", "38", "42"];

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-lg">
      <h3 className="text-lg font-semibold">{t("find_match")}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{t("find_sub")}</p>

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label className="text-[12.5px]">{t("looking_for")}</Label>
          <Select value={gender} onValueChange={(v) => setGender(v ?? "Female")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Female">{t("opt_bride")}</SelectItem>
              <SelectItem value="Male">{t("opt_groom")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12.5px]">{t("age_from")}</Label>
            <Select defaultValue="21">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{ages.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12.5px]">{t("age_to")}</Label>
            <Select defaultValue="30">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{ages.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12.5px]">{t("denomination")}</Label>
          <MultiSelect options={DENOMINATIONS} selected={denom} onChange={setDenom} placeholder={t("any_christian")} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12.5px]">{t("parish_congregation")}</Label>
          <MultiSelect options={CONGREGATIONS} selected={cong} onChange={setCong} placeholder={t("any")} />
        </div>

        {member ? (
          <Button onClick={search} className="w-full bg-gold text-maroon hover:bg-gold! hover:brightness-105">
            {t("search_matches")}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-[12.5px] text-muted-foreground">{t("signin_to_search")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={openSignIn} variant="outline" className="w-full">
                {t("nav_signin")}
              </Button>
              <Button render={<Link href="/register" />} nativeButton={false} className="w-full bg-gold text-maroon hover:bg-gold! hover:brightness-105">
                {t("nav_register")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

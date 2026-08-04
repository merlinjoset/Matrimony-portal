"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONGREGATIONS, DENOMINATIONS } from "@/lib/types";
import { useT } from "@/lib/i18n";

const ALL = "all";

export function BrowseFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useT();

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      <Select value={sp.get("gender") ?? ALL} onValueChange={(v) => update("gender", v)}>
        <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("all")}</SelectItem>
          <SelectItem value="Female">{t("brides")}</SelectItem>
          <SelectItem value="Male">{t("grooms")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sp.get("denomination") ?? ALL} onValueChange={(v) => update("denomination", v)}>
        <SelectTrigger className="w-[180px] bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("any_denom")}</SelectItem>
          {DENOMINATIONS.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sp.get("congregation") ?? ALL} onValueChange={(v) => update("congregation", v)}>
        <SelectTrigger className="w-[180px] bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("any_congregation")}</SelectItem>
          {CONGREGATIONS.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

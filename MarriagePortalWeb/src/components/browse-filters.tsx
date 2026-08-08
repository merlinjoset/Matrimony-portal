"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
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

  function updateMulti(key: string, values: string[]) {
    const params = new URLSearchParams(sp.toString());
    if (values.length === 0) params.delete(key);
    else params.set(key, values.join(","));
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  }

  const denoms = (sp.get("denomination") ?? "").split(",").filter(Boolean);
  const congs = (sp.get("congregation") ?? "").split(",").filter(Boolean);

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

      <MultiSelect
        className="w-[180px]"
        options={DENOMINATIONS}
        selected={denoms}
        onChange={(v) => updateMulti("denomination", v)}
        placeholder={t("any_denom")}
      />

      <MultiSelect
        className="w-[180px]"
        options={CONGREGATIONS}
        selected={congs}
        onChange={(v) => updateMulti("congregation", v)}
        placeholder={t("any_congregation")}
      />
    </div>
  );
}

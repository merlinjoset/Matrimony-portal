"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MultiSelect } from "@/components/ui/multi-select";
import { CONGREGATIONS, DENOMINATIONS } from "@/lib/types";
import { useT } from "@/lib/i18n";

export function BrowseFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useT();

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
      {/* Gender is fixed to the opposite of the viewer's own profile (a groom sees brides, and vice versa). */}
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

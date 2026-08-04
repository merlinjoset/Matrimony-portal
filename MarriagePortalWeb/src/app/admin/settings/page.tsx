"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AdminHeader } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

function Toggle({ defaultOn = true }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={cn("relative h-6 w-11 rounded-full transition", on ? "bg-brand-green" : "bg-muted-foreground/40")}
      aria-pressed={on}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

const SETTINGS = [
  { t: "Require parish verification", d: "New profiles stay hidden until a presbyter approves.", on: true },
  { t: "Hide contact until mutual interest", d: "Phone & email released only after both accept.", on: true },
  { t: "Free for partner-parish members", d: "Waive fees for verified members.", on: true },
];

export default function SettingsPage() {
  return (
    <>
      <AdminHeader title="Settings" subtitle="Portal preferences" />
      <div className="p-7">
        <Card className="max-w-3xl divide-y divide-border p-0">
          {SETTINGS.map((s) => (
            <div key={s.t} className="flex items-center gap-4 px-5 py-4">
              <div>
                <div className="text-sm font-semibold">{s.t}</div>
                <div className="text-[12.5px] text-muted-foreground">{s.d}</div>
              </div>
              <div className="ml-auto"><Toggle defaultOn={s.on} /></div>
            </div>
          ))}
          <div className="flex items-center gap-4 px-5 py-4">
            <div>
              <div className="text-sm font-semibold">Default language</div>
              <div className="text-[12.5px] text-muted-foreground">Language shown to new visitors of the public site.</div>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">English / தமிழ்</div>
          </div>
        </Card>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { LEVEL_LABEL } from "@/lib/types";

const LEVELS = [1, 2, 3];

export default function ChecklistsPage() {
  const [config, setConfig] = useState<Record<number, string[]> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getChecklist().then(setConfig).catch(() => toast.error("Could not load the checklist."));
  }, []);

  function setItem(level: number, index: number, value: string) {
    setConfig((c) => {
      if (!c) return c;
      const items = [...(c[level] ?? [])];
      items[index] = value;
      return { ...c, [level]: items };
    });
  }
  function addItem(level: number) {
    setConfig((c) => (c ? { ...c, [level]: [...(c[level] ?? []), ""] } : c));
  }
  function removeItem(level: number, index: number) {
    setConfig((c) => (c ? { ...c, [level]: (c[level] ?? []).filter((_, i) => i !== index) } : c));
  }

  async function save() {
    if (!config) return;
    // Drop blank rows before saving.
    const cleaned: Record<number, string[]> = {};
    for (const lvl of LEVELS) cleaned[lvl] = (config[lvl] ?? []).map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    try {
      await api.saveChecklist(cleaned);
      setConfig(cleaned);
      toast.success("Checklist saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the checklist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Approval Checklist"
        subtitle="The items each approver must confirm before approving their level. Levels 1 - 3 map to the assigned approver."
      />
      <div className="max-w-3xl p-7">
        {!config ? (
          <div className="space-y-4">
            {LEVELS.map((l) => <Skeleton key={l} className="h-40 w-full" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {LEVELS.map((level) => (
              <Card key={level} className="p-6">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-maroon text-[12px] font-bold text-white">{level}</span>
                  <h3 className="text-[15px] font-bold text-maroon">{LEVEL_LABEL[level]}</h3>
                </div>
                <p className="mb-4 text-[12.5px] text-muted-foreground">Items the Level {level} approver must tick.</p>

                <div className="space-y-2">
                  {(config[level] ?? []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 text-right text-[12px] text-muted-foreground">{i + 1}.</span>
                      <Input
                        value={item}
                        onChange={(e) => setItem(level, i, e.target.value)}
                        placeholder="Checklist item…"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(level, i)}
                        aria-label="Remove item"
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(config[level] ?? []).length === 0 && (
                    <p className="text-[12.5px] text-muted-foreground">No items yet.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => addItem(level)}
                  className="mt-3 text-[13px] font-semibold text-maroon hover:underline"
                >
                  + Add item
                </button>
              </Card>
            ))}

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save checklist"}</Button>
              <span className="text-[12.5px] text-muted-foreground">Changes apply to new approvals immediately.</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

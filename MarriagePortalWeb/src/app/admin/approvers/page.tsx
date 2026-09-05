"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { LEVEL_LABEL, type AdminUser, type CurrentAdmin } from "@/lib/types";

const LEVELS = [1, 2, 3];

export default function ApproversPage() {
  const [me, setMe] = useState<CurrentAdmin | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [assign, setAssign] = useState<Record<number, string[]> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMe().then(setMe).catch(() => {});
    api.getUsers().then(setUsers).catch(() => toast.error("Could not load users."));
    api.getApprovers().then(setAssign).catch(() => toast.error("Could not load assignments."));
  }, []);

  const canEdit = me?.role === "Super Admin";

  function toggle(level: number, userId: string) {
    setAssign((a) => {
      if (!a) return a;
      const cur = a[level] ?? [];
      return { ...a, [level]: cur.includes(userId) ? cur.filter((x) => x !== userId) : [...cur, userId] };
    });
  }

  async function save() {
    if (!assign) return;
    setSaving(true);
    try {
      await api.saveApprovers(assign);
      toast.success("Approver assignments saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save assignments.");
    } finally {
      setSaving(false);
    }
  }

  const loading = !users || !assign;

  return (
    <>
      <AdminHeader
        title="Approvers by Level"
        subtitle="Assign which staff approve each verification level. A level with no one assigned falls back to role level."
      />
      <div className="max-w-4xl p-7">
        {!canEdit && me && (
          <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Only a Super Admin can change approver assignments. You can view the current setup below.
          </p>
        )}
        {loading ? (
          <div className="space-y-4">{LEVELS.map((l) => <Skeleton key={l} className="h-40 w-full" />)}</div>
        ) : (
          <div className="space-y-5">
            {LEVELS.map((level) => {
              const chosen = assign![level] ?? [];
              return (
                <Card key={level} className="p-6">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-maroon text-[12px] font-bold text-white">{level}</span>
                    <h3 className="text-[15px] font-bold text-maroon">{LEVEL_LABEL[level]}</h3>
                    <span className="text-[12px] text-muted-foreground">
                      {chosen.length ? `${chosen.length} assigned` : "Nobody assigned - uses role level"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {users!.map((u) => {
                      const on = chosen.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${on ? "border-brand-green bg-brand-green/10" : "border-border hover:bg-muted"} ${canEdit ? "" : "pointer-events-none opacity-70"}`}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={!canEdit}
                            onChange={() => toggle(level, u.id)}
                            className="size-4 accent-[#12503a]"
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{u.name}</span>
                            <span className="block truncate text-[12px] text-muted-foreground">{u.role} · {u.status}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
            {canEdit && (
              <div className="flex items-center gap-3">
                <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save assignments"}</Button>
                <span className="text-[12.5px] text-muted-foreground">A Super Admin can always approve any level.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

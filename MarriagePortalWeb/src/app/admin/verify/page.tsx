"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminHeader, Avatar } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { APPROVAL_CHECKLIST, LEVEL_LABEL, type CurrentAdmin, type VerifyQueueItem } from "@/lib/types";

const ROLE_RANK: Record<string, number> = {
  "Office Staff": 1, Moderator: 1, "Parish Presbyter": 2, "Diocese Admin": 3, "Super Admin": 3,
};
const LEVEL_MIN_RANK: Record<number, number> = { 1: 1, 2: 2, 3: 3 };

function LevelPill({ level, done, current, by }: { level: number; done: boolean; current: boolean; by?: string | null }) {
  const cls = done
    ? "bg-brand-green/15 text-brand-green border-brand-green/30"
    : current
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : "bg-muted text-muted-foreground border-border";
  return (
    <div className={`rounded-lg border px-3 py-2 text-[12px] ${cls}`}>
      <div className="font-bold">L{level} · {LEVEL_LABEL[level]}</div>
      <div className="mt-0.5">{done ? `✓ ${by ?? "Approved"}` : current ? "Awaiting" : "Locked"}</div>
    </div>
  );
}

export default function VerifyQueue() {
  const [me, setMe] = useState<CurrentAdmin | null>(null);
  const [rows, setRows] = useState<VerifyQueueItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, string[]>>({});
  const [reject, setReject] = useState<VerifyQueueItem | null>(null);
  const [reason, setReason] = useState("");
  // Checklist is admin-configurable (see /admin/checklists); fall back to the built-in defaults.
  const [checklist, setChecklist] = useState<Record<number, string[]>>(APPROVAL_CHECKLIST);

  const load = useCallback(() => {
    api.getVerifyQueue().then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => {
    api.getMe().then(setMe).catch(() => {});
    api.getChecklist().then(setChecklist).catch(() => {});
    load();
  }, [load]);

  function toggle(pid: string, item: string) {
    setChecked((c) => {
      const cur = c[pid] ?? [];
      return { ...c, [pid]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] };
    });
  }

  async function approve(p: VerifyQueueItem) {
    const level = p.approvalLevel + 1;
    const items = checklist[level] ?? [];
    const done = checked[p.id] ?? [];
    if (!items.every((i) => done.includes(i))) return toast.error("Please confirm all checklist items first.");
    setBusy(p.id);
    try {
      await api.approveProfileLevel(p.id, level, done);
      toast.success(level === 3 ? `Final approval done - ${p.fullName} is now Verified.` : `Level ${level} approved for ${p.fullName}.`);
      setChecked((c) => ({ ...c, [p.id]: [] }));
      load();
    } catch (e) {
      toast.error(String(e).replace(/^\d+:\s*/, "") || "Approval failed.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmReject() {
    if (!reject) return;
    if (!reason.trim()) return toast.error("Please enter a reason for rejection.");
    const id = reject.id;
    setBusy(id);
    try {
      await api.setStatus(id, "Rejected", reason.trim());
      toast.success(`${reject.fullName} rejected. The reason was recorded.`);
      setReject(null);
      setReason("");
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(null);
    }
  }

  const myRank = me ? (ROLE_RANK[me.role] ?? 0) : 0;

  return (
    <>
      <AdminHeader
        title="Verification Queue"
        subtitle="Three-level approval - Initial check → Presbyter review → Final approval."
      />
      <div className="p-7">
        <div className="mb-4 rounded-lg border border-brand-green/25 bg-brand-green/10 px-4 py-3 text-sm text-brand-green">
          🕊️ Each listing needs <b>3 levels</b> of approval before it goes live. {me && <>You are signed in as <b>{me.name}</b> ({me.role}).</>}
        </div>

        {rows === null ? (
          <div className="space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No profiles waiting - all caught up. 🕊️</Card>
        ) : (
          <div className="space-y-5">
            {rows.map((m, i) => {
              const nextLevel = m.approvalLevel + 1;
              const items = checklist[nextLevel] ?? [];
              const done = checked[m.id] ?? [];
              const allChecked = items.every((it) => done.includes(it));
              const canApprove = myRank >= (LEVEL_MIN_RANK[nextLevel] ?? 99);
              const alreadyApproved = me?.role !== "Super Admin" && m.approvals.some((a) => a.byName === me?.name);
              return (
                <Card key={m.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={m.fullName} photo={m.mainPhotoUrl} i={i} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/members/${m.id}`} className="text-[15px] font-semibold hover:text-maroon hover:underline">
                        {m.fullName} {m.mainPhotoUrl && <span title="Has photo">📷</span>}
                      </Link>
                      <div className="text-[12.5px] text-muted-foreground">
                        {m.referenceId} · {m.gender === "Female" ? "Bride" : "Groom"} · {m.denomination} · {m.congregation}
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      disabled={busy === m.id}
                      onClick={() => { setReject(m); setReason(""); }}
                      className="border-destructive/40 text-destructive hover:bg-destructive/5"
                    >
                      ✕ Reject
                    </Button>
                  </div>

                  {/* Level progress */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((lv) => {
                      const appr = m.approvals.find((a) => a.level === lv);
                      return <LevelPill key={lv} level={lv} done={m.approvalLevel >= lv} current={nextLevel === lv} by={appr?.byName} />;
                    })}
                  </div>

                  {/* Next-level checklist + approve */}
                  <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 text-[12.5px] font-bold uppercase tracking-wide text-maroon">
                      Level {nextLevel} · {LEVEL_LABEL[nextLevel]} — checklist
                    </div>
                    {!canApprove ? (
                      <p className="text-sm text-muted-foreground">
                        Awaiting <b>Level {nextLevel}</b> approval by a higher role. Your role ({me?.role ?? "-"}) can&apos;t approve this level.
                      </p>
                    ) : alreadyApproved ? (
                      <p className="text-sm text-muted-foreground">You approved an earlier level - this level needs a different approver.</p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {items.map((it) => (
                            <label key={it} className="flex cursor-pointer items-start gap-2 text-sm">
                              <input type="checkbox" className="mt-1" checked={done.includes(it)} onChange={() => toggle(m.id, it)} />
                              <span>{it}</span>
                            </label>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          disabled={busy === m.id || !allChecked}
                          onClick={() => approve(m)}
                          className="mt-3 bg-brand-green text-white hover:bg-brand-green/90"
                        >
                          ✓ Approve Level {nextLevel}{nextLevel === 3 ? " & publish" : ""}
                        </Button>
                        {!allChecked && <span className="ml-2 text-[12px] text-muted-foreground">Confirm all items to enable.</span>}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!reject} onOpenChange={(o) => { if (!o) { setReject(null); setReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {reject?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label>Reason (recorded on the profile)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. membership could not be verified." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
            <Button onClick={confirmReject} disabled={busy === reject?.id} className="bg-destructive text-white hover:bg-destructive/90">Reject profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

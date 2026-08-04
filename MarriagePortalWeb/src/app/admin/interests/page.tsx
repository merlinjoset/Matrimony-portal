"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader, Avatar, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { Interest, InterestStatus } from "@/lib/types";

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} days ago`;
}

const tone = (s: InterestStatus) => (s === "Accepted" ? "green" : s === "Awaiting" ? "amber" : "grey");

export default function InterestsPage() {
  const [rows, setRows] = useState<Interest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.getInterests().then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, status: InterestStatus) {
    setBusy(id);
    try {
      await api.setInterestStatus(id, status);
      toast.success(`Interest ${status.toLowerCase()}.`);
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader title="Interests" subtitle="Contact details are released only when both sides accept." />
      <div className="p-7">
        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No interests yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">From (enquirer)</th>
                  <th className="px-5 py-3 font-bold">Interested in</th>
                  <th className="px-5 py-3 font-bold">Sent</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((x, i) => (
                  <tr key={x.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={x.fromName} i={i} />
                        <div>
                          <div className="text-sm font-semibold">{x.fromName}</div>
                          <div className="text-[12px] text-muted-foreground">{x.fromMobile}</div>
                          {x.message && <div className="mt-0.5 max-w-xs text-[12px] italic text-muted-foreground">“{x.message}”</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold">{x.toName}<span className="ml-1 font-normal text-muted-foreground">· {x.toReferenceId}</span></td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{ago(x.createdAt)}</td>
                    <td className="px-5 py-3"><Pill tone={tone(x.status)}>{x.status}</Pill></td>
                    <td className="px-5 py-3">
                      {x.status === "Awaiting" ? (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busy === x.id} onClick={() => decide(x.id, "Accepted")} className="bg-brand-green text-white hover:bg-brand-green/90">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" disabled={busy === x.id} onClick={() => decide(x.id, "Declined")} className="border-destructive/40 text-destructive hover:bg-destructive/5">
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}

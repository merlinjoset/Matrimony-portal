"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader, Avatar, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";

function tone(status: string): "green" | "amber" | "red" {
  return status === "Open" ? "amber" : status === "ActionTaken" ? "red" : "green";
}
function label(status: string): string {
  return status === "ActionTaken" ? "Actioned" : status;
}

export default function ReportsPage() {
  const [rows, setRows] = useState<Report[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.getReports().then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(load, [load]);

  async function act(r: Report, action: "dismiss" | "suspend") {
    setBusy(r.id);
    try {
      await api.resolveReport(r.id, action);
      toast.success(action === "suspend" ? `${r.profileName} suspended.` : "Report dismissed.");
      load();
    } catch {
      toast.error("Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader title="Reports" subtitle="Concerns raised by members about profiles." />
      <div className="p-7">
        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No reports. When a member reports a profile it appears here.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Profile</th>
                  <th className="px-5 py-3 font-bold">Reason</th>
                  <th className="px-5 py-3 font-bold">Reported by</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-muted/30 align-top">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.profileName} i={i + 3} />
                        <div>
                          <div className="text-sm font-semibold">{r.profileName}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {r.profileReferenceId}
                            {r.profileStatus && <> · now <span className={r.profileStatus === "Suspended" ? "font-semibold text-destructive" : "font-semibold text-brand-green"}>{r.profileStatus}</span></>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <div className="font-medium">{r.reason}</div>
                      {r.details && <div className="text-[12.5px] text-muted-foreground">{r.details}</div>}
                    </td>
                    <td className="px-5 py-3 text-sm">{r.reporterName ?? "Anonymous"}</td>
                    <td className="px-5 py-3"><Pill tone={tone(r.status)}>{label(r.status)}</Pill></td>
                    <td className="px-5 py-3">
                      {r.status === "Open" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r, "suspend")}
                            className="border-destructive/40 text-destructive hover:bg-destructive/5">Suspend</Button>
                          <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => act(r, "dismiss")}>Dismiss</Button>
                        </div>
                      ) : (
                        <div className="text-right text-[12.5px] text-muted-foreground">Resolved</div>
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

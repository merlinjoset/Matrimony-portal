"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { LEVEL_LABEL, type ApprovalLogEntry } from "@/lib/types";

export default function ApprovalLogPage() {
  const [log, setLog] = useState<ApprovalLogEntry[] | null>(null);

  useEffect(() => {
    api.getApprovalLog().then(setLog).catch(() => toast.error("Could not load the approval log."));
  }, []);

  return (
    <>
      <AdminHeader title="Approval Log" subtitle="Every verification level approval - who confirmed which profile, when, and what they ticked." />
      <div className="p-7">
        {!log ? (
          <Skeleton className="h-64 w-full" />
        ) : log.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No approvals recorded yet.</Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-[12px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Profile</th>
                    <th className="px-5 py-3 font-semibold">Level</th>
                    <th className="px-5 py-3 font-semibold">Approved by</th>
                    <th className="px-5 py-3 font-semibold">Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 align-top">
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold">{r.fullName}</span>
                        <span className="ml-1.5 text-[12px] text-muted-foreground">{r.referenceId}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="rounded-full bg-maroon/10 px-2.5 py-1 text-[12px] font-bold text-maroon">
                          L{r.level} · {LEVEL_LABEL[r.level] ?? ""}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium">{r.byName ?? "-"}</span>
                        {r.byRole && <span className="block text-[12px] text-muted-foreground">{r.byRole}</span>}
                      </td>
                      <td className="px-5 py-3">
                        {r.checklist.length ? (
                          <ul className="space-y-0.5 text-[12.5px] text-muted-foreground">
                            {r.checklist.map((c, i) => (
                              <li key={i} className="flex gap-1.5"><span className="text-brand-green">✓</span>{c}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

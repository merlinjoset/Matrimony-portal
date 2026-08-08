"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { LoginLog } from "@/lib/types";

export default function LoginActivityPage() {
  const [rows, setRows] = useState<LoginLog[] | null>(null);

  useEffect(() => {
    api.getLoginLogs().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <>
      <AdminHeader title="Login Activity" subtitle="Member sign-ins and blocked attempts, newest first." />
      <div className="p-7">
        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No sign-ins recorded yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">When</th>
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-5 py-3 font-bold">Username</th>
                  <th className="px-5 py-3 font-bold">IP address</th>
                  <th className="px-5 py-3 font-bold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm text-muted-foreground" title={l.userAgent ?? ""}>{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm font-semibold">{l.name ?? "-"}</td>
                    <td className="px-5 py-3 text-sm">{l.username}</td>
                    <td className="px-5 py-3 text-sm">{l.ip ?? "-"}</td>
                    <td className="px-5 py-3">
                      <Pill tone={l.success ? "green" : "red"}>{l.success ? "Allowed" : "Blocked"}</Pill>
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

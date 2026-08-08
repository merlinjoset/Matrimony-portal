"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminHeader, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { LoginLog } from "@/lib/types";

export default function LoginActivityPage() {
  const [rows, setRows] = useState<LoginLog[] | null>(null);
  const [result, setResult] = useState<"all" | "allowed" | "blocked">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.getLoginLogs().then(setRows).catch(() => setRows([]));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const term = q.trim().toLowerCase();
    return rows.filter((l) => {
      if (result === "allowed" && !l.success) return false;
      if (result === "blocked" && l.success) return false;
      if (term) {
        const hay = `${l.username} ${l.name ?? ""} ${l.ip ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [rows, result, q]);

  return (
    <>
      <AdminHeader
        title="Login Activity"
        subtitle="Member sign-ins and blocked attempts, newest first."
        action={
          <div className="flex items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user or IP…" className="w-52" />
            <Select value={result} onValueChange={(v) => setResult((v as "all" | "allowed" | "blocked") ?? "all")}>
              <SelectTrigger className="w-[140px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All results</SelectItem>
                <SelectItem value="allowed">Allowed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="p-7">
        <Card className="p-0">
          {filtered === null ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{rows && rows.length ? "No sign-ins match your filter." : "No sign-ins recorded yet."}</p>
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
                {filtered.map((l) => (
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

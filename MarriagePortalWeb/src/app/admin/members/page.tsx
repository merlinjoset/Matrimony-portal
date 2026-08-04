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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminHeader, Avatar, Pill, statusTone } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { ProfileListItem, ProfileStatus } from "@/lib/types";

const STATUSES = ["Pending", "Verified", "Active", "Suspended", "Rejected"] as const;

export default function MembersPage() {
  const [rows, setRows] = useState<ProfileListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<ProfileListItem | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setRows(null);
    api
      .browseProfiles({ status: filter === "all" ? undefined : filter, pageSize: 100 })
      .then((r) => {
        setRows(r.items);
        setTotal(r.total);
      })
      .catch(() => setRows([]));
  }, [filter]);

  useEffect(load, [load]);

  async function setStatus(id: string, status: ProfileStatus, name: string) {
    setBusy(id);
    try {
      await api.setStatus(id, status);
      toast.success(`${name} → ${status}.`);
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(null);
    }
  }

  async function confirmSuspend() {
    if (!suspendTarget) return;
    if (!reason.trim()) return toast.error("Please enter a reason for suspension.");
    const id = suspendTarget.id;
    setBusy(id);
    try {
      await api.setStatus(id, "Suspended", reason.trim());
      toast.success(`${suspendTarget.fullName} suspended. The reason was recorded.`);
      setSuspendTarget(null);
      setReason("");
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="Members"
        subtitle={rows ? `${total} member${total === 1 ? "" : "s"}` : "Loading…"}
        action={
          <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
            <SelectTrigger className="w-[170px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <div className="p-7">
        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No members match this filter.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-5 py-3 font-bold">For</th>
                  <th className="px-5 py-3 font-bold">Congregation</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((m, i) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.fullName} photo={m.mainPhotoUrl} i={i} />
                        <div>
                          <div className="text-sm font-semibold">{m.fullName}</div>
                          <div className="text-[12px] text-muted-foreground">{m.referenceId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm">{m.gender === "Female" ? "Bride" : "Groom"}</td>
                    <td className="px-5 py-3 text-sm">{m.congregation}</td>
                    <td className="px-5 py-3"><Pill tone={statusTone(m.status)}>{m.status}</Pill></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button render={<Link href={`/admin/members/${m.id}`} />} nativeButton={false} size="sm" variant="ghost">
                          View
                        </Button>
                        {m.status === "Suspended" ? (
                          <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => setStatus(m.id, "Active", m.fullName)}>
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === m.id}
                            onClick={() => { setSuspendTarget(m); setReason(""); }}
                            className="border-destructive/40 text-destructive hover:bg-destructive/5"
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Dialog open={!!suspendTarget} onOpenChange={(o) => { if (!o) { setSuspendTarget(null); setReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend {suspendTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Reason for suspension *</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reported for inappropriate content; requested by the family; duplicate profile…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button disabled={busy === suspendTarget?.id} onClick={confirmSuspend} className="bg-destructive text-white hover:bg-destructive/90">
              Suspend profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

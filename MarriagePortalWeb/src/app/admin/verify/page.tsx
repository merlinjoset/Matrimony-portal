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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminHeader, Avatar, Pill } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { ProfileListItem } from "@/lib/types";

export default function VerifyQueue() {
  const [rows, setRows] = useState<ProfileListItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reject, setReject] = useState<ProfileListItem | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    api
      .browseProfiles({ status: "Pending", pageSize: 100 })
      .then((r) => setRows(r.items))
      .catch(() => setRows([]));
  }, []);

  useEffect(load, [load]);

  async function approve(id: string, name: string) {
    setBusy(id);
    try {
      await api.setStatus(id, "Verified");
      setRows((rs) => (rs ? rs.filter((r) => r.id !== id) : rs));
      toast.success(`${name} approved & verified.`);
    } catch {
      toast.error("Action failed. Is the API running?");
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
      setRows((rs) => (rs ? rs.filter((r) => r.id !== id) : rs));
      toast.success(`${reject.fullName} rejected. The reason was recorded.`);
      setReject(null);
      setReason("");
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader
        title="Verification Queue"
        subtitle="Confirm faith & parish membership before approving a profile."
      />
      <div className="p-7">
        <div className="mb-4 rounded-lg border border-brand-green/25 bg-brand-green/10 px-4 py-3 text-sm text-brand-green">
          🕊️ <b>Reminder:</b> Verify the member belongs to a partner parish. Never record caste or community.
        </div>

        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">No profiles waiting - all caught up. 🕊️</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-5 py-3 font-bold">Home parish</th>
                  <th className="px-5 py-3 font-bold">Denomination</th>
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
                          <Link href={`/admin/members/${m.id}`} className="text-sm font-semibold hover:text-maroon hover:underline">
                            {m.fullName} {m.mainPhotoUrl && <span title="Has photo">📷</span>}
                          </Link>
                          <div className="text-[12px] text-muted-foreground">
                            {m.referenceId} · {m.gender === "Female" ? "Bride" : "Groom"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm">{m.congregation}</td>
                    <td className="px-5 py-3 text-sm">{m.denomination}</td>
                    <td className="px-5 py-3"><Pill tone="amber">Pending</Pill></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busy === m.id}
                          onClick={() => approve(m.id, m.fullName)}
                          className="bg-brand-green text-white hover:bg-brand-green/90"
                        >
                          ✓ Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === m.id}
                          onClick={() => { setReject(m); setReason(""); }}
                          className="border-destructive/40 text-destructive hover:bg-destructive/5"
                        >
                          ✕ Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Dialog open={!!reject} onOpenChange={(o) => { if (!o) { setReject(null); setReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {reject?.fullName}</DialogTitle>
            <DialogDescription>
              Give a reason - it is recorded on the profile and shown to the parish office (and the member, once member sign-in is enabled).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Reason for rejection *</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Photo is unclear; membership could not be confirmed; details incomplete…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
            <Button
              disabled={busy === reject?.id}
              onClick={confirmReject}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Reject profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

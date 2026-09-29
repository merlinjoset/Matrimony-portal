"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const STATUSES = ["Pending", "Verified", "Active", "Committed", "Suspended", "Rejected"] as const;

export default function MembersPage() {
  const [rows, setRows] = useState<ProfileListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  // "committed" listings live in their own tab and are hidden from the main Profiles list.
  const [view, setView] = useState<"profiles" | "committed">("profiles");
  const [busy, setBusy] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<ProfileListItem | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setRows(null);
    const params =
      view === "committed"
        ? { status: "Committed", pageSize: 100 }
        : { status: filter === "all" ? undefined : filter, excludeStatus: filter === "all" ? "Committed" : undefined, pageSize: 100 };
    api
      .browseProfiles(params)
      .then((r) => {
        setRows(r.items);
        setTotal(r.total);
      })
      .catch(() => setRows([]));
  }, [filter, view]);

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

  // Success testimony for a committed profile - loaded on open, saved via the admin endpoint.
  const [testimonyTarget, setTestimonyTarget] = useState<ProfileListItem | null>(null);
  const [testimonyText, setTestimonyText] = useState("");
  const [testimonyVideo, setTestimonyVideo] = useState("");
  const [testimonyLoading, setTestimonyLoading] = useState(false);
  const [testimonySaving, setTestimonySaving] = useState(false);

  function closeTestimony() {
    setTestimonyTarget(null);
    setTestimonyText("");
    setTestimonyVideo("");
  }

  async function openTestimony(m: ProfileListItem) {
    setTestimonyTarget(m);
    setTestimonyText("");
    setTestimonyVideo("");
    setTestimonyLoading(true);
    try {
      const p = await api.getProfile(m.id);
      setTestimonyText(p.testimony ?? "");
      setTestimonyVideo(p.testimonyVideoUrl ?? "");
    } catch {
      // start blank if it can't be loaded
    } finally {
      setTestimonyLoading(false);
    }
  }

  async function saveTestimony() {
    if (!testimonyTarget) return;
    setTestimonySaving(true);
    try {
      await api.setTestimony(testimonyTarget.id, testimonyText.trim() || null, testimonyVideo.trim() || null);
      toast.success(`Testimony saved for ${testimonyTarget.fullName}.`);
      closeTestimony();
    } catch {
      toast.error("Could not save the testimony.");
    } finally {
      setTestimonySaving(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Profiles"
        subtitle={rows ? `${total} ${view === "committed" ? "committed " : ""}profile${total === 1 ? "" : "s"}` : "Loading…"}
        action={
          view === "profiles" ? (
            <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
              <SelectTrigger className="w-[170px] bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.filter((s) => s !== "Committed").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />
      <div className="flex gap-2 border-b border-border bg-white px-7 pt-3">
        {([["profiles", "Profiles"], ["committed", "💍 Committed"]] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`-mb-px border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${view === v ? "border-maroon text-maroon" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-7">
        <Card className="p-0">
          {rows === null ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{view === "committed" ? "No committed profiles yet." : "No members match this filter."}</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Member</th>
                  <th className="px-5 py-3 font-bold">For</th>
                  <th className="px-5 py-3 font-bold">Congregation</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold">Registered</th>
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
                    <td className="px-5 py-3 whitespace-nowrap text-sm text-muted-foreground" title={new Date(m.createdAt).toLocaleString()}>
                      {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button render={<Link href={`/admin/members/${m.id}`} />} nativeButton={false} size="sm" variant="ghost">
                          View
                        </Button>
                        <Button render={<Link href={`/admin/members/${m.id}/edit`} />} nativeButton={false} size="sm" variant="ghost">
                          Edit
                        </Button>
                        {m.status === "Suspended" || m.status === "Committed" ? (
                          <>
                            {m.status === "Committed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openTestimony(m)}
                                className="border-brand-green/40 text-brand-green hover:bg-brand-green/5"
                                title="Write or edit the success testimony"
                              >
                                ✍️ Testimony
                              </Button>
                            )}
                            <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => setStatus(m.id, "Verified", m.fullName)}>
                              Reactivate
                            </Button>
                          </>
                        ) : (
                          <>
                            {(m.status === "Verified" || m.status === "Active") && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy === m.id}
                                onClick={() => setStatus(m.id, "Verified", m.fullName)}
                                title="Confirm this listing is still valid - resets the 6-month re-verification clock"
                              >
                                Re-verify
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === m.id}
                              onClick={() => setStatus(m.id, "Committed", m.fullName)}
                              className="border-brand-green/40 text-brand-green hover:bg-brand-green/5"
                              title="Mark this profile as married / committed - it will be removed from browsing"
                            >
                              💍 Committed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === m.id}
                              onClick={() => { setSuspendTarget(m); setReason(""); }}
                              className="border-destructive/40 text-destructive hover:bg-destructive/5"
                            >
                              Suspend
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
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

      <Dialog open={!!testimonyTarget} onOpenChange={(o) => { if (!o && !testimonySaving) closeTestimony(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Success testimony{testimonyTarget ? ` - ${testimonyTarget.fullName}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Testimony</Label>
              <Textarea
                rows={5}
                value={testimonyText}
                onChange={(e) => setTestimonyText(e.target.value)}
                placeholder={testimonyLoading ? "Loading…" : "e.g. Thank God, they were joined in holy matrimony on … A short thanksgiving note from the couple or family."}
                disabled={testimonyLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Video link</Label>
              <Input
                type="url"
                value={testimonyVideo}
                onChange={(e) => setTestimonyVideo(e.target.value)}
                placeholder="https://youtu.be/… or a Google Drive / Vimeo link"
                disabled={testimonyLoading}
              />
            </div>
            <p className="text-[12px] text-muted-foreground">Recorded with the profile as a success story. Leave a field blank to clear it.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={testimonySaving} onClick={closeTestimony}>Cancel</Button>
            <Button disabled={testimonySaving || testimonyLoading} onClick={saveTestimony} className="bg-brand-green text-white hover:bg-brand-green/90">
              {testimonySaving ? "Saving…" : "Save testimony"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

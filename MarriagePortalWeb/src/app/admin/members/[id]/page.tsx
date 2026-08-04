"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { AdminHeader, Pill, statusTone } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { ProfileDetail, ProfileStatus } from "@/lib/types";

const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-1.5">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-[15px]">{value}</dd>
    </div>
  );
}

export default function AdminMemberDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [p, setP] = useState<ProfileDetail | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reasonMode, setReasonMode] = useState<"reject" | "suspend" | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    api.getProfile(id).then(setP).catch(() => setError(true));
  }, [id]);
  useEffect(load, [load]);

  async function setStatus(status: ProfileStatus, label: string) {
    setBusy(true);
    try {
      await api.setStatus(id, status);
      toast.success(`Status changed to ${label}.`);
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReason() {
    if (!reason.trim()) return toast.error("Please enter a reason.");
    const status = reasonMode === "suspend" ? "Suspended" : "Rejected";
    setBusy(true);
    try {
      await api.setStatus(id, status, reason.trim());
      toast.success(status === "Suspended" ? "Profile suspended. The reason was recorded." : "Profile rejected. The reason was recorded.");
      setReasonMode(null);
      setReason("");
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Member" />
        <div className="p-7">
          <Link href="/admin/members" className="text-sm font-semibold text-maroon">← Back to members</Link>
          <p className="mt-4 text-muted-foreground">Could not load this profile.</p>
        </div>
      </>
    );
  }

  if (!p) {
    return (
      <>
        <AdminHeader title="Member" />
        <div className="space-y-4 p-7">
          <Skeleton className="h-5 w-32" />
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title={p.fullName}
        subtitle={`${p.referenceId} · ${p.gender === "Female" ? "Bride" : "Groom"}${p.age ? ` · ${p.age} yrs` : ""}`}
        action={<Pill tone={statusTone(p.status)}>{p.status}</Pill>}
      />
      <div className="p-7">
        <Link href="/admin/members" className="mb-4 inline-block text-sm font-semibold text-maroon">← Back to members</Link>

        {(p.status === "Rejected" || p.status === "Suspended") && p.statusNote && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <span className="font-bold text-destructive">{p.status} - reason:</span>{" "}
            <span className="text-foreground">{p.statusNote}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div>
            <div className="grid h-64 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-maroon to-brand-green text-7xl font-bold text-white">
              {p.mainPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.mainPhotoUrl} alt={p.fullName} className="h-full w-full object-cover" />
              ) : (
                initials(p.fullName)
              )}
            </div>

            {/* Admin status actions */}
            <Card className="mt-4 p-4">
              <div className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</div>
              <div className="grid gap-2">
                {p.status === "Pending" && (
                  <>
                    <Button size="sm" disabled={busy} onClick={() => setStatus("Verified", "Verified")} className="bg-brand-green text-white hover:bg-brand-green/90">✓ Approve</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => { setReasonMode("reject"); setReason(""); }} className="border-destructive/40 text-destructive hover:bg-destructive/5">✕ Reject</Button>
                  </>
                )}
                {p.status === "Rejected" && (
                  <Button size="sm" disabled={busy} onClick={() => setStatus("Verified", "Verified")} className="bg-brand-green text-white hover:bg-brand-green/90">✓ Approve now</Button>
                )}
                {(p.status === "Verified" || p.status === "Active") && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => { setReasonMode("suspend"); setReason(""); }} className="border-destructive/40 text-destructive hover:bg-destructive/5">Suspend</Button>
                )}
                {p.status === "Suspended" && (
                  <Button size="sm" disabled={busy} onClick={() => setStatus("Active", "Active")} className="bg-brand-green text-white hover:bg-brand-green/90">Reactivate</Button>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card className="mb-4 p-6">
              <h3 className="text-lg font-semibold text-maroon">Basic details</h3>
              <Separator className="my-3" />
              <dl>
                <Row label="Reference ID" value={p.referenceId} />
                <Row label="Created for" value={p.createdFor} />
                <Row label="Looking for" value={p.lookingFor} />
                <Row label="Age / Height" value={[p.age ? `${p.age} yrs` : null, p.height].filter(Boolean).join(" · ")} />
                <Row label="Marital status" value={p.maritalStatus} />
                <Row label="Mother tongue" value={p.motherTongue} />
                <Row label="Location" value={p.city} />
              </dl>
            </Card>

            <Card className="mb-4 p-6">
              <h3 className="text-lg font-semibold text-maroon">Faith &amp; church</h3>
              <Separator className="my-3" />
              <dl>
                <Row label="Denomination" value={p.denomination} />
                <Row label="Home parish" value={p.homeParish} />
                <Row label="Congregation" value={p.congregation} />
                <Row label="Walk of faith" value={p.aboutFaith} />
              </dl>
            </Card>

            <Card className="mb-4 p-6">
              <h3 className="text-lg font-semibold text-maroon">Education &amp; profession</h3>
              <Separator className="my-3" />
              <dl>
                <Row label="Education" value={p.education} />
                <Row label="Profession" value={p.profession} />
              </dl>
            </Card>

            {(p.fatherOccupation || p.motherOccupation) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-maroon">Family</h3>
                <Separator className="my-3" />
                <dl>
                  <Row label="Father" value={p.fatherOccupation} />
                  <Row label="Mother" value={p.motherOccupation} />
                </dl>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={reasonMode !== null} onOpenChange={(o) => { if (!o) { setReasonMode(null); setReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reasonMode === "suspend" ? "Suspend" : "Reject"} {p.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Reason for {reasonMode === "suspend" ? "suspension" : "rejection"} *</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Photo is unclear; membership could not be confirmed; details incomplete…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonMode(null)}>Cancel</Button>
            <Button disabled={busy} onClick={confirmReason} className="bg-destructive text-white hover:bg-destructive/90">
              {reasonMode === "suspend" ? "Suspend profile" : "Reject profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

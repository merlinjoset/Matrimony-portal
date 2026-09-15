"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { ContactCard } from "@/components/contact-card";
import { MemberGate } from "@/components/member-gate";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import { parseSiblings } from "@/lib/siblings";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { REPORT_REASONS, type ContactReveal, type ProfileDetail } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 py-1.5">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-[15px]">{value}</dd>
    </div>
  );
}

/** Owner-facing tracker for the 3-level parish verification (Initial check -> Admin review -> Final approval). */
function VerificationProgress({
  status,
  level,
  statusNote,
}: {
  status: ProfileDetail["status"];
  level: number;
  statusNote: string | null;
}) {
  const { t } = useT();
  const allDone = status === "Verified" || status === "Active" || status === "Committed";
  const steps = [t("vp_l1"), t("vp_l2"), t("vp_l3")];
  const stateOf = (n: number): "done" | "current" | "pending" => {
    if (allDone || level >= n) return "done";
    if (status === "Pending" && level + 1 === n) return "current";
    return "pending";
  };
  const note =
    status === "Rejected" ? t("vp_rejected")
    : status === "Suspended" ? t("vp_suspended")
    : status === "Committed" ? t("vp_committed")
    : allDone ? t("vp_verified")
    : t("vp_in_review");

  return (
    <Card className="mt-4 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">{t("vp_title")}</span>
        <StatusBadge status={status} />
      </div>
      <ol className="space-y-2.5">
        {steps.map((label, i) => {
          const st = stateOf(i + 1);
          return (
            <li key={i} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  st === "done" ? "bg-brand-green text-white"
                  : st === "current" ? "bg-gold text-maroon ring-2 ring-gold/40"
                  : "bg-muted text-muted-foreground",
                )}
              >
                {st === "done" ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("text-sm", st === "pending" ? "text-muted-foreground" : "font-medium")}>{label}</span>
              <span
                className={cn(
                  "ml-auto text-[11px] font-medium",
                  st === "done" ? "text-brand-green" : st === "current" ? "text-maroon" : "text-muted-foreground",
                )}
              >
                {st === "done" ? t("vp_step_done") : st === "current" ? t("vp_step_current") : t("vp_step_pending")}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12px] leading-snug text-muted-foreground">{note}</p>
      {(status === "Rejected" || status === "Suspended") && statusNote && (
        <p className="mt-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-[12px] text-destructive">
          {statusNote}
        </p>
      )}
    </Card>
  );
}

export function ProfileDetailView({ p, hasPhoto = false }: { p: ProfileDetail; hasPhoto?: boolean }) {
  return (
    <MemberGate requireProfile>
      <ProfileDetailContent p={p} hasPhoto={hasPhoto} />
    </MemberGate>
  );
}

function ProfileDetailContent({ p, hasPhoto }: { p: ProfileDetail; hasPhoto: boolean }) {
  const { t } = useT();
  const { has, toggle, member, openSignIn } = useMemberShortlist();
  const saved = has(p.id);

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ fromName: "", fromMobile: "", message: "" });
  // Pre-fill the member's own name + contact so Express Interest asks only for the message.
  const [self, setSelf] = useState<{ name: string | null; mobile: string | null } | null>(null);
  const prefilled = !!(self?.name && self?.mobile);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  // Photo is private: revealed by the contact/photo request flow (owner or approved viewer).
  const [reveal, setReveal] = useState<ContactReveal | null>(null);
  const isOwner = !!reveal?.isOwner;
  // Owners may edit only before the parish approves it; once Verified/Active (or locked as
  // Committed/Suspended) the listing is read-only and changes go through the parish office.
  const canEdit = isOwner && (p.status === "Pending" || p.status === "Rejected");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [reqBusy, setReqBusy] = useState(false);

  useEffect(() => {
    if (!member) { setSelf(null); return; }
    api.getMemberSelf(member.memberId)
      .then((s) => {
        setSelf(s);
        setForm((f) => ({ ...f, fromName: s.name ?? f.fromName, fromMobile: s.mobile ?? f.fromMobile }));
      })
      .catch(() => {});
  }, [member]);

  useEffect(() => {
    if (!member) { setReveal(null); setPhotoUrl(null); return; }
    api.getContact(p.id, member.memberId)
      .then((r) => { setReveal(r); setPhotoUrl(r.photoUrl); })
      .catch(() => { setReveal(null); setPhotoUrl(null); });
  }, [member, p.id]);

  async function requestPhoto() {
    if (!member) { openSignIn(); return; }
    setReqBusy(true);
    try {
      await api.requestContact(p.id, member.memberId, "Photo");
      setReveal((r) => ({
        isOwner: false,
        mobile: r?.mobile ?? null,
        mobileStatus: r?.mobileStatus ?? null,
        photoUrl: null,
        photoStatus: "Pending",
      }));
      toast.success(t("photo_requested"));
    } catch {
      toast.error(t("c_req_err"));
    } finally {
      setReqBusy(false);
    }
  }

  async function onChangePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !member) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image is too large (max 5 MB).");
    setPhotoBusy(true);
    try {
      const { url } = await api.uploadPhoto(file);
      await api.updateProfilePhoto(p.id, member.memberId, url);
      setPhotoUrl(url);
      toast.success("Photo updated.");
    } catch {
      toast.error("Could not update the photo. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (!member) return;
    setPhotoBusy(true);
    try {
      await api.updateProfilePhoto(p.id, member.memberId, null);
      setPhotoUrl(null);
      toast.success("Photo removed.");
    } catch {
      toast.error("Could not remove the photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submitReport() {
    setReporting(true);
    try {
      await api.reportProfile(p.id, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
        reporterMemberId: member?.memberId,
        reporterName: member?.name,
      });
      toast.success("Thank you. This profile has been reported to the parish office.");
      setReportOpen(false);
      setReportDetails("");
      setReportReason(REPORT_REASONS[0]);
    } catch {
      toast.error("Could not submit the report. Please try again.");
    } finally {
      setReporting(false);
    }
  }

  async function sendInterest() {
    if (!form.fromName.trim()) return toast.error(t("ei_name_req"));
    if (!form.fromMobile.trim()) return toast.error(t("ei_mobile_req"));
    setSending(true);
    try {
      await api.createInterest({ toProfileId: p.id, ...form });
      toast.success(t("ei_ok"));
      setOpen(false);
      setForm({ fromName: "", fromMobile: "", message: "" });
    } catch {
      toast.error(t("ei_err"));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <Link href="/browse" className="mb-3 inline-block text-sm font-semibold text-maroon">
        {t("back_profiles")}
      </Link>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <div className="grid h-72 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-maroon to-brand-green text-8xl font-bold text-white shadow-lg">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={p.fullName} className="h-full w-full object-cover" />
            ) : hasPhoto ? (
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <Lock className="size-8 opacity-90" />
                <span className="text-sm font-medium opacity-90">{t("photo_locked")}</span>
              </div>
            ) : (
              initials(p.fullName)
            )}
          </div>

          {/* Photo is private - a non-owner requests it and the member approves before it shows. */}
          {!isOwner && hasPhoto && !photoUrl && (
            <div className="mt-2">
              {reveal?.photoStatus === "Pending" ? (
                <p className="text-sm font-medium text-amber-700">{t("photo_pending")}</p>
              ) : reveal?.photoStatus === "Declined" ? (
                <p className="text-sm text-muted-foreground">{t("photo_declined")}</p>
              ) : (
                <Button
                  onClick={requestPhoto}
                  disabled={reqBusy}
                  variant="outline"
                  className="w-full border-gold text-maroon hover:bg-gold/10"
                >
                  {reqBusy ? t("photo_requesting") : t("photo_request")}
                </Button>
              )}
            </div>
          )}
          {isOwner && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {canEdit && (
                <>
                  <label className="cursor-pointer">
                    <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-[13px] font-medium hover:bg-muted">
                      {photoBusy ? "Uploading…" : photoUrl ? "📷 Change photo" : "📷 Add photo"}
                    </span>
                    <input type="file" accept="image/*" hidden onChange={onChangePhoto} disabled={photoBusy} />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      disabled={photoBusy}
                      className="inline-flex h-8 items-center rounded-lg border border-destructive/40 px-3 text-[13px] font-medium text-destructive hover:bg-destructive/5"
                    >
                      Remove
                    </button>
                  )}
                  <Link
                    href={`/profiles/${p.id}/edit`}
                    className="inline-flex h-8 items-center rounded-lg border border-maroon/40 px-3 text-[13px] font-medium text-maroon hover:bg-maroon/5"
                  >
                    ✏️ {t("edit_profile_btn")}
                  </Link>
                </>
              )}
              <span className="text-[11.5px] text-muted-foreground">This is your profile</span>
            </div>
          )}
          {isOwner && (
            <VerificationProgress status={p.status} level={p.approvalLevel} statusNote={p.statusNote} />
          )}
          {/* Actions apply only to other members' profiles - hidden on your own. */}
          {!isOwner && (
            <div className="mt-4 grid gap-2.5">
              <Button onClick={() => setOpen(true)} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
                {t("express_interest")}
              </Button>
              <Button
                variant="outline"
                onClick={() => toggle(p)}
                className={saved ? "border-gold bg-gold/10 text-maroon" : ""}
              >
                {saved ? t("shortlisted") : t("shortlist")}
              </Button>
              <button
                onClick={() => setReportOpen(true)}
                className="mt-1 text-center text-[12.5px] font-medium text-muted-foreground hover:text-destructive"
              >
                ⚑ Report this profile
              </button>
            </div>
          )}

          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Report profile - {p.fullName}</DialogTitle>
                <DialogDescription>Let the parish office know if something is wrong with this profile. Reports are confidential.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Reason</Label>
                  <Select value={reportReason} onValueChange={(v) => setReportReason(v ?? REPORT_REASONS[0])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Details <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={3} placeholder="Anything that helps us review this." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                <Button disabled={reporting} onClick={submitReport} className="bg-destructive text-white hover:bg-destructive/90">
                  {reporting ? "Sending…" : "Submit report"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("ei_title")} - {p.fullName}</DialogTitle>
                <DialogDescription>{t("ei_intro")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {prefilled ? (
                  <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
                    <span className="text-muted-foreground">{t("ei_sending_as")} </span>
                    <span className="font-semibold">{form.fromName}</span>
                    <span className="text-muted-foreground"> · {form.fromMobile}</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>{t("ei_name")}</Label>
                      <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("ei_mobile")}</Label>
                      <Input value={form.fromMobile} onChange={(e) => setForm({ ...form, fromMobile: e.target.value })} placeholder="+971 …" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label>{t("ei_message")}</Label>
                  <Textarea rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("ei_cancel")}</Button>
                <Button disabled={sending} onClick={sendInterest} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
                  {sending ? t("ei_sending") : t("ei_send")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{p.fullName}</h1>
            <StatusBadge status={p.status} />
          </div>
          <p className="mb-5 mt-1 text-muted-foreground">
            {t("profile_id")} {p.referenceId} · {t(p.gender === "Female" ? "bride" : "groom")}
            {p.age ? ` · ${p.age} ${t("years")}` : ""}
          </p>

          <ContactCard profileId={p.id} />

          <Card className="mb-4 p-6">
            <h3 className="text-lg font-semibold text-maroon">{t("d_basic")}</h3>
            <Separator className="my-3" />
            <dl>
              <Row label={t("d_age_height")} value={[p.age ? `${p.age} ${t("yrs")}` : null, p.height].filter(Boolean).join(" · ")} />
              <Row label={t("d_marital")} value={p.maritalStatus} />
              <Row label={t("d_location")} value={p.city} />
              <Row label={t("d_mtongue")} value={p.motherTongue} />
              <Row label={t("l_caste")} value={p.caste} />
              <Row label={t("l_native")} value={p.nativePlace} />
            </dl>
          </Card>

          <Card className="mb-4 p-6">
            <h3 className="text-lg font-semibold text-maroon">{t("d_faith")}</h3>
            <Separator className="my-3" />
            <dl>
              <Row label={t("d_denom")} value={p.denomination} />
              <Row label={t("d_parish")} value={p.homeParish} />
              <Row label={t("d_congregation")} value={p.congregation} />
              <Row label={t("d_walk")} value={p.aboutFaith} />
              <Row label={t("d_expect")} value={p.expectations} />
            </dl>
          </Card>

          <Card className="mb-4 p-6">
            <h3 className="text-lg font-semibold text-maroon">{t("d_edu")}</h3>
            <Separator className="my-3" />
            <dl>
              <Row label={t("d_education")} value={p.education} />
              <Row label={t("d_profession")} value={p.profession} />
              <Row label={t("l_company")} value={p.company} />
              <Row label={t("l_worklocation")} value={p.workLocation} />
              <Row label={t("l_salary")} value={p.salary} />
            </dl>
          </Card>

          {(p.fatherName || p.fatherOccupation || p.motherName || p.motherOccupation || p.siblingsDetails) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-maroon">{t("d_family")}</h3>
              <Separator className="my-3" />
              <dl>
                <Row label={t("l_father_name")} value={p.fatherName} />
                <Row label={t("l_father_occ")} value={p.fatherOccupation} />
                <Row label={t("l_mother_name")} value={p.motherName} />
                <Row label={t("l_mother_occ")} value={p.motherOccupation} />
                {(() => {
                  const parsed = parseSiblings(p.siblingsDetails);
                  if (!parsed) return null;
                  if (typeof parsed === "string") return <Row label={t("l_siblings")} value={parsed} />;
                  return (
                    <div className="grid grid-cols-[150px_1fr] gap-3 py-1.5">
                      <dt className="text-sm font-semibold text-muted-foreground">{t("l_siblings")}</dt>
                      <dd className="text-[15px]">
                        <ul className="space-y-0.5">
                          {parsed.map((s, i) => (
                            <li key={i}>
                              {s.name}
                              {s.status ? ` (${s.status === "Married" ? t("o_married") : t("o_unmarried")})` : ""}
                              {s.occupation ? ` - ${s.occupation}` : ""}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  );
                })()}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

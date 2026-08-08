"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import { api } from "@/lib/api";
import { REPORT_REASONS, type ProfileDetail } from "@/lib/types";
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

export function ProfileDetailView({ p }: { p: ProfileDetail }) {
  return (
    <MemberGate>
      <ProfileDetailContent p={p} />
    </MemberGate>
  );
}

function ProfileDetailContent({ p }: { p: ProfileDetail }) {
  const { t } = useT();
  const { has, toggle, member } = useMemberShortlist();
  const saved = has(p.id);

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ fromName: "", fromMobile: "", message: "" });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

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
            {p.mainPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.mainPhotoUrl} alt={p.fullName} className="h-full w-full object-cover" />
            ) : (
              initials(p.fullName)
            )}
          </div>
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
                <div className="space-y-1.5">
                  <Label>{t("ei_name")}</Label>
                  <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("ei_mobile")}</Label>
                  <Input value={form.fromMobile} onChange={(e) => setForm({ ...form, fromMobile: e.target.value })} placeholder="+971 …" />
                </div>
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
            </dl>
          </Card>

          {(p.fatherOccupation || p.motherOccupation) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-maroon">{t("d_family")}</h3>
              <Separator className="my-3" />
              <dl>
                <Row label={t("d_father")} value={p.fatherOccupation} />
                <Row label={t("d_mother")} value={p.motherOccupation} />
              </dl>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

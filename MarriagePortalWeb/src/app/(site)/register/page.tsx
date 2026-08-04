"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { CONGREGATIONS, COUNTRY_CODES, DENOMINATIONS, type CreateProfileInput, type Gender, type MemberValidation } from "@/lib/types";

const empty: CreateProfileInput = {
  membershipNo: "",
  createdFor: "Son",
  lookingFor: "Bride",
  mobile: "",
  fullName: "",
  gender: "Female",
  dateOfBirth: null,
  height: "",
  maritalStatus: "Never married",
  motherTongue: "Tamil",
  denomination: "CSI",
  homeParish: "",
  congregation: "Dubai",
  aboutFaith: "",
  education: "",
  profession: "",
  city: "",
  fatherOccupation: "",
  motherOccupation: "",
  mainPhotoUrl: null,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px]">{label}</Label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useT();
  const [form, setForm] = useState<CreateProfileInput>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [membership, setMembership] = useState<MemberValidation | null>(null);
  const [dialCode, setDialCode] = useState("+971");
  const [phone, setPhone] = useState("");

  function updateMobile(code: string, num: string) {
    setDialCode(code);
    setPhone(num);
    set("mobile", num.trim() ? `${code} ${num.trim()}` : "");
  }

  async function validateCard() {
    const card = form.membershipNo.trim();
    if (!card) return;
    setChecking(true);
    try {
      setMembership(await api.validateMembership(card));
    } catch {
      setMembership({ valid: false, memberId: null, name: null, congregation: null, message: t("ei_err") });
    } finally {
      setChecking(false);
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error(t("ph_err_type"));
    if (f.size > 5 * 1024 * 1024) return toast.error(t("ph_err_size"));
    setUploading(true);
    try {
      const { url } = await api.uploadPhoto(f);
      set("mainPhotoUrl", url);
    } catch {
      toast.error(t("ph_err_upload"));
    } finally {
      setUploading(false);
    }
  }

  function set<K extends keyof CreateProfileInput>(key: K, value: CreateProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const setStr = (key: keyof CreateProfileInput) => (v: string | null) => set(key, (v ?? "") as never);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!membership?.valid) return toast.error(t("m_required"));
    if (!form.fullName.trim()) return toast.error(t("toast_name"));
    setSaving(true);
    try {
      const created = await api.createProfile({ ...form, dateOfBirth: form.dateOfBirth || null });
      toast.success(t("toast_ok"));
      router.push(`/profiles/${created.id}`);
    } catch {
      toast.error(t("toast_err"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold">{t("reg_h")}</h2>
        <p className="mb-5 text-muted-foreground">{t("reg_sub")}</p>
        <div className="mb-6 rounded-lg border border-brand-green/25 bg-brand-green/10 px-3.5 py-3 text-sm text-brand-green">
          {t("reg_note")}
        </div>

        <form onSubmit={onSubmit} className="space-y-7">
          <fieldset className="space-y-3">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_membership")}</legend>
            <p className="text-[12.5px] text-muted-foreground">{t("m_hint")}</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 space-y-1.5" style={{ minWidth: 220 }}>
                <Label className="text-[12.5px]">{t("l_membership")}</Label>
                <Input
                  value={form.membershipNo}
                  onChange={(e) => { set("membershipNo", e.target.value); setMembership(null); }}
                  onBlur={validateCard}
                  placeholder={t("ph_membership")}
                  className={membership?.valid ? "border-brand-green" : membership && !membership.valid ? "border-destructive" : ""}
                />
              </div>
              <Button type="button" variant="outline" disabled={checking || !form.membershipNo.trim()} onClick={validateCard}>
                {checking ? t("m_validating") : t("m_validate")}
              </Button>
            </div>
            {membership?.valid ? (
              <div className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3.5 py-2.5 text-sm text-brand-green">
                {t("m_valid")} - {membership.name}{membership.congregation ? `, ${membership.congregation}` : ""}
              </div>
            ) : membership && !membership.valid ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                {membership.message}
              </div>
            ) : null}
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_photo")}</legend>
            <div className="flex flex-wrap items-center gap-5">
              <label className="relative grid size-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-gold bg-gold/10 transition hover:bg-gold/20">
                {form.mainPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.mainPhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl text-gold">📷</span>
                )}
                <input type="file" accept="image/*" hidden onChange={onPhoto} disabled={uploading} />
              </label>
              <div>
                <div className="text-sm font-semibold">{t("ph_title")}</div>
                <p className="mb-2.5 max-w-sm text-[12.5px] text-muted-foreground">{t("ph_hint")}</p>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-[13px] font-medium hover:bg-muted">
                      {uploading ? t("ph_uploading") : t("ph_choose")}
                    </span>
                    <input type="file" accept="image/*" hidden onChange={onPhoto} disabled={uploading} />
                  </label>
                  {form.mainPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => set("mainPhotoUrl", null)}
                      className="inline-flex h-8 items-center rounded-lg border border-destructive/40 px-3 text-[13px] font-medium text-destructive hover:bg-destructive/5"
                    >
                      {t("ph_remove")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_createdby")}</legend>
            <div className="grid gap-3.5 md:grid-cols-3">
              <Field label={t("l_createdfor")}>
                <Select value={form.createdFor} onValueChange={setStr("createdFor")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Son">{t("o_son")}</SelectItem>
                    <SelectItem value="Daughter">{t("o_daughter")}</SelectItem>
                    <SelectItem value="Ward">{t("o_ward")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("l_lookingfor")}>
                <Select value={form.lookingFor} onValueChange={setStr("lookingFor")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bride">{t("bride")}</SelectItem>
                    <SelectItem value="Groom">{t("groom")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("l_mobile")}>
                <div className="flex gap-2">
                  <Select value={dialCode} onValueChange={(v) => updateMobile(v ?? "+971", phone)}>
                    <SelectTrigger className="w-[92px] shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    className="flex-1"
                    value={phone}
                    onChange={(e) => updateMobile(dialCode, e.target.value)}
                    placeholder="50 123 4567"
                    required
                  />
                </div>
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_personal")}</legend>
            <div className="grid gap-3.5 md:grid-cols-3">
              <Field label={t("l_fullname")}>
                <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
              </Field>
              <Field label={t("l_dob")}>
                <Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
              </Field>
              <Field label={t("l_gender")}>
                <Select value={form.gender} onValueChange={(v) => set("gender", (v ?? "Female") as Gender)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">{t("g_female")}</SelectItem>
                    <SelectItem value="Male">{t("g_male")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("l_height")}>
                <Input value={form.height ?? ""} onChange={(e) => set("height", e.target.value)} placeholder={`e.g. 5'6"`} />
              </Field>
              <Field label={t("l_marital")}>
                <Select value={form.maritalStatus} onValueChange={setStr("maritalStatus")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Never married">{t("m_never")}</SelectItem>
                    <SelectItem value="Divorced">{t("m_div")}</SelectItem>
                    <SelectItem value="Widowed">{t("m_wid")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("l_city")}>
                <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Dubai, UAE" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_faith")}</legend>
            <div className="grid gap-3.5 md:grid-cols-3">
              <Field label={t("l_denom")}>
                <Select value={form.denomination} onValueChange={setStr("denomination")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DENOMINATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("l_parish")}>
                <Input value={form.homeParish} onChange={(e) => set("homeParish", e.target.value)} placeholder="e.g. CSI Tamil Parish, Dubai" />
              </Field>
              <Field label={t("l_congregation")}>
                <Select value={form.congregation} onValueChange={setStr("congregation")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONGREGATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("l_walk")}>
              <Textarea value={form.aboutFaith ?? ""} onChange={(e) => set("aboutFaith", e.target.value)} rows={2} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_edu")}</legend>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label={t("l_edu")}>
                <Input value={form.education ?? ""} onChange={(e) => set("education", e.target.value)} placeholder="e.g. Bachelor's (B.E)" />
              </Field>
              <Field label={t("l_prof")}>
                <Input value={form.profession ?? ""} onChange={(e) => set("profession", e.target.value)} placeholder="e.g. Nurse, Engineer" />
              </Field>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving || !membership?.valid} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
              {saving ? t("submitting") : t("submit_btn")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(empty)}>
              {t("reset_btn")}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

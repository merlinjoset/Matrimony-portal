"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { useMemberShortlist } from "@/lib/member-shortlist";
import { parseSiblings } from "@/lib/siblings";
import { joinSalary, splitSalary } from "@/lib/salary";
import {
  CONGREGATIONS,
  COUNTRY_CODES,
  CURRENCIES,
  DENOMINATIONS,
  type Gender,
  type OwnProfileDetail,
  type UpdateProfileInput,
} from "@/lib/types";

const empty: UpdateProfileInput = {
  createdFor: "Self",
  lookingFor: "Bride",
  mobile: "",
  email: "",
  fullName: "",
  gender: "Female",
  dateOfBirth: null,
  height: "",
  maritalStatus: "Never married",
  motherTongue: "Tamil",
  caste: "",
  nativePlace: "",
  denomination: "CSI",
  homeParish: "",
  congregation: "Dubai",
  presbyterName: "",
  presbyterContact: "",
  aboutFaith: "",
  expectations: "",
  education: "",
  profession: "",
  city: "",
  salary: "",
  company: "",
  workLocation: "",
  fatherName: "",
  fatherOccupation: "",
  motherName: "",
  motherOccupation: "",
  siblingsDetails: "",
  mainPhotoUrl: null,
};

type SiblingRow = { name: string; status: string; occupation: string };

const MIN_AGE = 21;
const KNOWN_CODES = COUNTRY_CODES.map((c) => c.code) as readonly string[];

function ageOf(iso: string): number | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}

function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/** Split a stored "+971 501234567" mobile into a known dial code + national digits. */
function splitMobile(mobile: string | null): { code: string; phone: string } {
  const raw = (mobile ?? "").trim();
  if (!raw) return { code: "+971", phone: "" };
  const sp = raw.indexOf(" ");
  if (sp > 0) {
    const code = raw.slice(0, sp);
    const phone = raw.slice(sp + 1).replace(/\D/g, "");
    if (KNOWN_CODES.includes(code)) return { code, phone };
  }
  // No recognised code prefix: keep the digits, default the code.
  return { code: "+971", phone: raw.replace(/\D/g, "") };
}

/** Seed the sibling rows from the stored value (JSON list, or one row from legacy free text). */
function siblingsToRows(raw: string | null): SiblingRow[] {
  const parsed = parseSiblings(raw);
  if (!parsed) return [];
  if (typeof parsed === "string") return [{ name: parsed, status: "Unmarried", occupation: "" }];
  return parsed.map((s) => ({ name: s.name, status: s.status === "Married" ? "Married" : "Unmarried", occupation: s.occupation }));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px]">{label}</Label>
      {children}
    </div>
  );
}

export default function EditProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();

  const [form, setForm] = useState<UpdateProfileInput>(empty);
  const [siblings, setSiblings] = useState<SiblingRow[]>([]);
  const [dialCode, setDialCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [casteList, setCasteList] = useState<string[]>([]);
  useEffect(() => { api.getCastes().then(setCasteList).catch(() => {}); }, []);

  const addSibling = () => setSiblings((s) => [...s, { name: "", status: "Unmarried", occupation: "" }]);
  const updateSibling = (i: number, field: keyof SiblingRow, val: string) =>
    setSiblings((s) => s.map((x, k) => (k === i ? { ...x, [field]: val } : x)));
  const removeSibling = (i: number) => setSiblings((s) => s.filter((_, k) => k !== i));

  function set<K extends keyof UpdateProfileInput>(key: K, value: UpdateProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const setStr = (key: keyof UpdateProfileInput) => (v: string | null) => set(key, (v ?? "") as never);

  function phoneMax(code: string): number {
    return code === "+971" ? 9 : code === "+91" ? 10 : 0;
  }

  function updateMobile(code: string, num: string) {
    const max = phoneMax(code);
    let digits = num.replace(/\D/g, "");
    if (max > 0) digits = digits.slice(0, max);
    setDialCode(code);
    setPhone(digits);
    set("mobile", digits ? `${code} ${digits}` : "");
  }

  function updateSalary(cur: string, amt: string) {
    const clean = amt.replace(/[^\d.,]/g, "");
    setCurrency(cur);
    setSalaryAmount(clean);
    set("salary", joinSalary(cur, clean));
  }

  const hydrate = useCallback((p: OwnProfileDetail) => {
    const { code, phone: ph } = splitMobile(p.mobile);
    setDialCode(code);
    setPhone(ph);
    const sal = splitSalary(p.salary);
    setCurrency(sal.currency);
    setSalaryAmount(sal.amount);
    setSiblings(siblingsToRows(p.siblingsDetails));
    setForm({
      createdFor: p.createdFor || "Self",
      lookingFor: p.lookingFor || (p.gender === "Male" ? "Bride" : "Groom"),
      mobile: p.mobile ?? "",
      email: p.email ?? "",
      fullName: p.fullName,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth ?? null,
      height: p.height ?? "",
      maritalStatus: p.maritalStatus || "Never married",
      motherTongue: p.motherTongue || "Tamil",
      caste: p.caste ?? "",
      nativePlace: p.nativePlace ?? "",
      denomination: p.denomination || "CSI",
      homeParish: p.homeParish ?? "",
      congregation: p.congregation || "Dubai",
      presbyterName: p.presbyterName ?? "",
      presbyterContact: p.presbyterContact ?? "",
      aboutFaith: p.aboutFaith ?? "",
      expectations: p.expectations ?? "",
      education: p.education ?? "",
      profession: p.profession ?? "",
      city: p.city ?? "",
      salary: p.salary ?? "",
      company: p.company ?? "",
      workLocation: p.workLocation ?? "",
      fatherName: p.fatherName ?? "",
      fatherOccupation: p.fatherOccupation ?? "",
      motherName: p.motherName ?? "",
      motherOccupation: p.motherOccupation ?? "",
      siblingsDetails: p.siblingsDetails ?? "",
      mainPhotoUrl: p.mainPhotoUrl ?? null,
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!member) { setLoading(false); setDenied(true); return; }
    let alive = true;
    setLoading(true);
    api.getOwnProfile(id, member.memberId)
      .then((p) => { if (alive) { hydrate(p); setDenied(false); } })
      .catch(() => { if (alive) setDenied(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ready, member, id, hydrate]);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    if (!form.fullName.trim()) return toast.error(t("toast_name"));
    if (!form.dateOfBirth) return toast.error(t("dob_req"));
    if ((ageOf(form.dateOfBirth) ?? 0) < MIN_AGE) return toast.error(t("dob_min"));
    if (!form.caste?.trim()) return toast.error(t("caste_req"));
    if (!form.nativePlace?.trim()) return toast.error(t("native_req"));
    const pmax = phoneMax(dialCode);
    if (pmax > 0 && phone.length !== pmax) return toast.error(t("mobile_len"));
    setSaving(true);
    try {
      const lookingFor = form.gender === "Male" ? "Bride" : "Groom";
      const cleanSiblings = siblings.filter((s) => s.name.trim() || s.occupation.trim());
      await api.updateProfile(id, member.memberId, {
        ...form,
        lookingFor,
        dateOfBirth: form.dateOfBirth || null,
        siblingsDetails: cleanSiblings.length ? JSON.stringify(cleanSiblings) : null,
      });
      toast.success(t("edit_saved"));
      router.push(`/profiles/${id}`);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t("toast_err"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-12">
        <Card className="p-8 text-muted-foreground">{t("edit_loading")}</Card>
      </section>
    );
  }

  if (denied) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-12">
        <Card className="space-y-4 p-8">
          <p className="text-muted-foreground">{member ? t("edit_denied") : t("edit_signin")}</p>
          <div className="flex gap-3">
            {!member && <Button onClick={openSignIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">{t("signin_btn")}</Button>}
            <Button variant="outline" render={<Link href={`/profiles/${id}`} />} nativeButton={false}>{t("edit_cancel")}</Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold">{t("edit_h")}</h2>
        <p className="mb-4 text-muted-foreground">{t("edit_sub")}</p>
        <div className="mb-6 rounded-lg border border-maroon/20 bg-maroon/5 px-3.5 py-3 text-sm text-maroon">
          {t("edit_reverify_note")}
        </div>

        <form onSubmit={onSubmit} className="space-y-7">
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
                    <SelectItem value="Self">{t("o_self")}</SelectItem>
                    <SelectItem value="Son">{t("o_son")}</SelectItem>
                    <SelectItem value="Daughter">{t("o_daughter")}</SelectItem>
                    <SelectItem value="Brother">{t("o_brother")}</SelectItem>
                    <SelectItem value="Sister">{t("o_sister")}</SelectItem>
                    <SelectItem value="Other">{t("o_other")}</SelectItem>
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
                    inputMode="numeric"
                    maxLength={phoneMax(dialCode) || undefined}
                    className="flex-1"
                    value={phone}
                    onChange={(e) => updateMobile(dialCode, e.target.value)}
                    placeholder={dialCode === "+91" ? "9876543210" : "501234567"}
                    required
                  />
                </div>
              </Field>
              <Field label={t("l_email")}>
                <Input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@example.com"
                />
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
                <Input
                  type="date"
                  value={form.dateOfBirth ?? ""}
                  max={isoYearsAgo(MIN_AGE)}
                  min={isoYearsAgo(100)}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
              <Field label={t("l_gender")}>
                <Select
                  value={form.gender}
                  onValueChange={(v) => {
                    const g = (v ?? "Female") as Gender;
                    setForm((f) => ({ ...f, gender: g, lookingFor: g === "Male" ? "Bride" : "Groom" }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v) => (v === "Male" ? t("g_male") : t("g_female"))}</SelectValue>
                  </SelectTrigger>
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
              <Field label={`${t("l_caste")} *`}>
                <Input
                  list="caste-options"
                  value={form.caste === "Caste No Bar" ? "" : (form.caste ?? "")}
                  disabled={form.caste === "Caste No Bar"}
                  onChange={(e) => set("caste", e.target.value)}
                  placeholder={t("ph_caste")}
                />
                <datalist id="caste-options">
                  {casteList.map((c) => <option key={c} value={c} />)}
                </datalist>
                <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.caste === "Caste No Bar"}
                    onChange={(e) => set("caste", e.target.checked ? "Caste No Bar" : "")}
                    className="size-3.5 accent-[maroon]"
                  />
                  {t("caste_no_bar")}
                </label>
              </Field>
              <Field label={`${t("l_native")} *`}>
                <Input value={form.nativePlace ?? ""} onChange={(e) => set("nativePlace", e.target.value)} placeholder={t("ph_native")} />
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
              {(form.congregation === "India" || form.congregation === "Other") && (
                <>
                  <Field label={t("l_presbyter_name")}>
                    <Input value={form.presbyterName ?? ""} onChange={(e) => set("presbyterName", e.target.value)} placeholder={t("ph_presbyter_name")} />
                  </Field>
                  <Field label={t("l_presbyter_contact")}>
                    <Input value={form.presbyterContact ?? ""} onChange={(e) => set("presbyterContact", e.target.value)} placeholder={t("ph_presbyter_contact")} />
                  </Field>
                </>
              )}
            </div>
            <Field label={t("l_walk")}>
              <Textarea value={form.aboutFaith ?? ""} onChange={(e) => set("aboutFaith", e.target.value)} rows={2} />
            </Field>
            <Field label={t("l_expect")}>
              <Textarea value={form.expectations ?? ""} onChange={(e) => set("expectations", e.target.value)} rows={2} placeholder={t("ph_expect")} />
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
              <Field label={t("l_company")}>
                <Input value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} placeholder={t("ph_company")} />
              </Field>
              <Field label={t("l_worklocation")}>
                <Input value={form.workLocation ?? ""} onChange={(e) => set("workLocation", e.target.value)} placeholder={t("ph_worklocation")} />
              </Field>
              <Field label={t("l_salary")}>
                <div className="flex gap-2">
                  <Select value={currency} onValueChange={(v) => updateSalary(v ?? "AED", salaryAmount)}>
                    <SelectTrigger className="w-[88px] shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input className="flex-1" inputMode="decimal" value={salaryAmount} onChange={(e) => updateSalary(currency, e.target.value)} placeholder={t("ph_salary")} />
                </div>
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_family")}</legend>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label={t("l_father_name")}>
                <Input value={form.fatherName ?? ""} onChange={(e) => set("fatherName", e.target.value)} />
              </Field>
              <Field label={t("l_father_occ")}>
                <Input value={form.fatherOccupation ?? ""} onChange={(e) => set("fatherOccupation", e.target.value)} />
              </Field>
              <Field label={t("l_mother_name")}>
                <Input value={form.motherName ?? ""} onChange={(e) => set("motherName", e.target.value)} />
              </Field>
              <Field label={t("l_mother_occ")}>
                <Input value={form.motherOccupation ?? ""} onChange={(e) => set("motherOccupation", e.target.value)} />
              </Field>
            </div>
            <div className="space-y-2">
              <Label className="text-[12.5px]">{t("l_siblings")}</Label>
              {siblings.map((s, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_150px_1fr_auto]">
                  <Input placeholder={t("l_sib_name")} value={s.name} onChange={(e) => updateSibling(i, "name", e.target.value)} />
                  <Select value={s.status} onValueChange={(v) => updateSibling(i, "status", v ?? "Unmarried")}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unmarried">{t("o_unmarried")}</SelectItem>
                      <SelectItem value="Married">{t("o_married")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder={t("l_sib_occ")} value={s.occupation} onChange={(e) => updateSibling(i, "occupation", e.target.value)} />
                  <button
                    type="button"
                    onClick={() => removeSibling(i)}
                    className="inline-flex h-9 items-center rounded-lg border border-destructive/40 px-3 text-[13px] font-medium text-destructive hover:bg-destructive/5"
                    aria-label={t("remove_sibling")}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSibling}>
                {t("add_sibling")}
              </Button>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-gold text-maroon hover:bg-gold! hover:brightness-105"
            >
              {saving ? t("edit_saving") : t("edit_save")}
            </Button>
            <Button type="button" variant="outline" render={<Link href={`/profiles/${id}`} />} nativeButton={false}>
              {t("edit_cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

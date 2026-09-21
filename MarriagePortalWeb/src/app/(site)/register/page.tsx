"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import { joinSalary } from "@/lib/salary";
import { CONGREGATIONS, COUNTRY_CODES, CURRENCIES, DENOMINATIONS, type CreateProfileInput, type Gender, type MemberValidation, type SubmitterDetails } from "@/lib/types";

const empty: CreateProfileInput = {
  membershipNo: "",
  createdFor: "Son",
  lookingFor: "Groom",
  mobile: "",
  mobile2: "",
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
  refereeName: "",
  refereeContact: "",
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

const MIN_AGE = 21;

/** Whole-years age for a YYYY-MM-DD string, or null if unparseable. */
function ageOf(iso: string): number | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a;
}

/** ISO date exactly `years` ago from today (for the date input's min/max bounds). */
function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5${className ? ` ${className}` : ""}`}>
      <Label className="text-[12.5px]">{label}</Label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useT();
  const { member } = useMemberShortlist();
  const [form, setForm] = useState<CreateProfileInput>(empty);
  // Siblings are a repeatable list; serialized to JSON into siblingsDetails on submit.
  const [siblings, setSiblings] = useState<Array<{ name: string; status: string; occupation: string }>>([]);
  const addSibling = () => setSiblings((s) => [...s, { name: "", status: "Unmarried", occupation: "" }]);
  const updateSibling = (i: number, field: "name" | "status" | "occupation", val: string) =>
    setSiblings((s) => s.map((x, k) => (k === i ? { ...x, [field]: val } : x)));
  const removeSibling = (i: number) => setSiblings((s) => s.filter((_, k) => k !== i));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [membership, setMembership] = useState<MemberValidation | null>(null);
  // True when the validated card already has a profile - block a duplicate, point them to editing.
  const [dupProfile, setDupProfile] = useState(false);
  const [dialCode, setDialCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [dialCode2, setDialCode2] = useState("+971");
  const [phone2, setPhone2] = useState("");
  // Salary is entered as a currency + amount, stored combined (e.g. "AED 12,000").
  const [currency, setCurrency] = useState("AED");
  const [salaryAmount, setSalaryAmount] = useState("");
  function updateSalary(cur: string, amt: string) {
    const clean = amt.replace(/[^\d.,]/g, "");
    setCurrency(cur);
    setSalaryAmount(clean);
    set("salary", joinSalary(cur, clean));
  }
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  // "Details of the Person Submitting the Form" - a mandatory popup shown only when the profile
  // is being created on behalf of someone else (createdFor != "Self").
  const emptySubmitter = {
    relationship: "Father",
    relationshipOther: "",
    name: "",
    mobile: "",
    email: "",
    country: "",
    city: "",
    churchMembership: "",
    preferredContact: "Contact either of us",
    declaration: false,
    consent: false,
  };
  const [consentOpen, setConsentOpen] = useState(false);
  // The consent captured from the popup (shown right after the T&C is agreed, before final submit).
  const [submitterConsent, setSubmitterConsent] = useState<SubmitterDetails | null>(null);
  const [submitter, setSubmitter] = useState(emptySubmitter);
  const setSub = <K extends keyof typeof emptySubmitter>(k: K, v: (typeof emptySubmitter)[K]) =>
    setSubmitter((prev) => ({ ...prev, [k]: v }));
  // Non-member email-OTP path (an alternative to the membership card).
  const [authMode, setAuthMode] = useState<"card" | "email">("card");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [emailToken, setEmailToken] = useState<string | null>(null);
  const identityOk = authMode === "card" ? !!membership?.valid : !!emailToken;
  // Distinct castes already on file power the caste autocomplete (members can still type a new one).
  const [casteList, setCasteList] = useState<string[]>([]);
  useEffect(() => { api.getCastes().then(setCasteList).catch(() => {}); }, []);

  // Required national-number length by country: UAE 9 digits, India 10; others unrestricted (0).
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

  function updateMobile2(code: string, num: string) {
    const max = phoneMax(code);
    let digits = num.replace(/\D/g, "");
    if (max > 0) digits = digits.slice(0, max);
    setDialCode2(code);
    setPhone2(digits);
    set("mobile2", digits ? `${code} ${digits}` : "");
  }

  async function validateCard() {
    const card = form.membershipNo.trim();
    if (!card) return;
    setChecking(true);
    setDupProfile(false);
    try {
      const m = await api.validateMembership(card);
      setMembership(m);
      // If this membership already has a profile, warn and block a duplicate.
      if (m.valid && m.memberId) {
        const hp = await api.hasProfile(m.memberId).catch(() => ({ hasProfile: false }));
        setDupProfile(hp.hasProfile);
      }
    } catch {
      setMembership({ valid: false, memberId: null, name: null, congregation: null, message: t("ei_err") });
    } finally {
      setChecking(false);
    }
  }

  async function sendOtp() {
    const email = otpEmail.trim();
    if (!email) return;
    setOtpSending(true);
    try {
      const res = await api.sendEmailOtp(email);
      setOtpSent(true);
      setEmailToken(null);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast_err"));
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyOtp() {
    const email = otpEmail.trim();
    const code = otpCode.trim();
    if (!email || code.length !== 6) return;
    setOtpVerifying(true);
    try {
      const res = await api.verifyEmailOtp(email, code);
      setEmailToken(res.token);
      // Prefill the profile's contact email with the just-verified address (unless one is already typed).
      if (!form.email?.trim()) set("email", email);
      toast.success(res.message);
    } catch (err) {
      setEmailToken(null);
      toast.error(err instanceof Error ? err.message : t("toast_err"));
    } finally {
      setOtpVerifying(false);
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
    if (!identityOk) return toast.error(authMode === "card" ? t("m_required") : t("otp_required"));
    if (authMode === "card" && dupProfile) return toast.error(t("dup_profile"));
    if (!form.fullName.trim()) return toast.error(t("toast_name"));
    if (!form.dateOfBirth) return toast.error(t("dob_req"));
    if ((ageOf(form.dateOfBirth) ?? 0) < MIN_AGE) return toast.error(t("dob_min"));
    if (!form.caste?.trim()) return toast.error(t("caste_req"));
    if (!form.nativePlace?.trim()) return toast.error(t("native_req"));
    if (form.congregation === "Other" && !form.refereeName?.trim()) return toast.error(t("referee_name_req"));
    if (form.congregation === "Other" && !form.refereeContact?.trim()) return toast.error(t("referee_contact_req"));
    const pmax = phoneMax(dialCode);
    if (pmax > 0 && phone.length !== pmax) return toast.error(t("mobile_len"));
    const pmax2 = phoneMax(dialCode2);
    if (phone2 && pmax2 > 0 && phone2.length !== pmax2) return toast.error(t("mobile_len"));
    if (!agree) return toast.error(t("tc_req"));
    // Guests choose a username + password: this creates their member login (admin activates it).
    if (!member && (!username.trim() || password.length < 6)) return toast.error(t("acc_hint"));
    // Creating on behalf of someone else? The consent (captured via the popup at the T&C step) is
    // mandatory - if it is somehow missing, re-open the popup instead of submitting.
    if (form.createdFor !== "Self" && !submitterConsent) {
      setConsentOpen(true);
      return;
    }
    await doCreate(form.createdFor !== "Self" ? submitterConsent ?? undefined : undefined);
  }

  // Validate the "person submitting the form" consent and record it. The profile is created later,
  // when the member clicks the main Submit button.
  function submitConsent() {
    const req = (v: string) => !!v.trim();
    if (submitter.relationship === "Other" && !req(submitter.relationshipOther)) return toast.error("Please specify your relationship to the bride/groom.");
    if (!req(submitter.name)) return toast.error("Please enter the name of the person submitting the form.");
    if (!req(submitter.mobile)) return toast.error("Please enter a mobile / WhatsApp number.");
    if (!req(submitter.email)) return toast.error("Please enter an email address.");
    if (!req(submitter.country)) return toast.error("Please enter the country of residence.");
    if (!req(submitter.city)) return toast.error("Please enter the city / emirate / state / district.");
    if (!req(submitter.churchMembership)) return toast.error("Please enter the church membership details.");
    if (!submitter.declaration) return toast.error("Please agree to the declaration to continue.");
    if (!submitter.consent) return toast.error("Please give the consent to share the profile to continue.");
    const details: SubmitterDetails = {
      relationship: submitter.relationship,
      relationshipOther: submitter.relationship === "Other" ? submitter.relationshipOther.trim() : null,
      name: submitter.name.trim(),
      mobile: submitter.mobile.trim(),
      email: submitter.email.trim(),
      country: submitter.country.trim(),
      city: submitter.city.trim(),
      churchMembership: submitter.churchMembership.trim(),
      preferredContact: submitter.preferredContact,
      declaration: true,
      consent: true,
      submittedAt: new Date().toISOString(),
    };
    setSubmitterConsent(details);
    setConsentOpen(false);
    toast.success("Consent recorded. You can now submit the profile.");
  }

  async function doCreate(submitterDetails?: SubmitterDetails) {
    setSaving(true);
    try {
      if (!member) {
        try {
          const res =
            authMode === "email"
              ? await api.signupGuest(otpEmail.trim(), emailToken!, username.trim(), password, form.fullName.trim())
              : await api.signup(form.membershipNo.trim(), username.trim(), password);
          toast.success(res.message ?? t("su_ok"));
        } catch (err) {
          // An existing account for this card is fine - the profile can still be registered.
          const msg = err instanceof Error ? err.message : "";
          if (!msg.toLowerCase().includes("already exists")) {
            toast.error(msg || t("toast_err"));
            setSaving(false);
            return;
          }
        }
      }
      // "Looking for" is derived from the profile's gender (a groom seeks a bride and vice versa).
      const lookingFor = form.gender === "Male" ? "Bride" : "Groom";
      const cleanSiblings = siblings.filter((s) => s.name.trim() || s.occupation.trim());
      const created = await api.createProfile({
        ...form,
        lookingFor,
        dateOfBirth: form.dateOfBirth || null,
        siblingsDetails: cleanSiblings.length ? JSON.stringify(cleanSiblings) : null,
        submitterDetails: submitterDetails ?? null,
        emailToken: authMode === "email" ? emailToken ?? undefined : undefined,
      });
      toast.success(t("toast_ok"));
      setConsentOpen(false);
      router.push(`/profiles/${created.id}`);
    } catch (err) {
      // Surface the real server message when we have one; fall back to the generic notice.
      toast.error(err instanceof Error && err.message ? err.message : t("toast_err"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold">{t("reg_h")}</h2>
        <p className="mb-5 text-muted-foreground">{t("reg_sub")}</p>
        <div className="mb-4 rounded-lg border border-brand-green/25 bg-brand-green/10 px-3.5 py-3 text-sm text-brand-green">
          {t("reg_note")}
        </div>

        <div className="mb-6 rounded-xl border border-maroon/20 bg-maroon/5 p-4">
          <div className="mb-2 text-[13px] font-bold uppercase tracking-wide text-maroon">{t("reg_how_h")}</div>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li className="flex gap-2"><span>📝</span><span>{t("how_1")}</span></li>
            <li className="flex gap-2"><span>🛡️</span><span>{t("how_2")}</span></li>
            <li className="flex gap-2"><span>🔒</span><span>{t("how_3")}</span></li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="space-y-7">
          <fieldset className="space-y-3">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_membership")}</legend>

            {/* Member (card) vs non-member (email OTP) */}
            <div className="inline-flex rounded-lg border border-border p-0.5 text-[13px] font-medium">
              <button
                type="button"
                onClick={() => setAuthMode("card")}
                className={`rounded-md px-3 py-1.5 transition ${authMode === "card" ? "bg-maroon text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("reg_mode_member")}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("email")}
                className={`rounded-md px-3 py-1.5 transition ${authMode === "email" ? "bg-maroon text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t("reg_mode_guest")}
              </button>
            </div>

            {authMode === "card" ? (
              <>
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
                {dupProfile && (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                    {t("dup_profile")}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-[12.5px] text-muted-foreground">{t("otp_hint")}</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 space-y-1.5" style={{ minWidth: 220 }}>
                    <Label className="text-[12.5px]">{t("l_otp_email")}</Label>
                    <Input
                      type="email"
                      value={otpEmail}
                      disabled={!!emailToken}
                      onChange={(e) => { setOtpEmail(e.target.value); setEmailToken(null); setOtpSent(false); }}
                      placeholder={t("ph_otp_email")}
                      className={emailToken ? "border-brand-green" : ""}
                    />
                  </div>
                  <Button type="button" variant="outline" disabled={otpSending || !otpEmail.trim() || !!emailToken} onClick={sendOtp}>
                    {otpSending ? t("otp_sending") : otpSent ? t("otp_resend") : t("otp_send")}
                  </Button>
                </div>
                {otpSent && !emailToken && (
                  <>
                    <p className="text-[12.5px] text-muted-foreground">{t("otp_sent")}</p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 space-y-1.5" style={{ minWidth: 180 }}>
                        <Label className="text-[12.5px]">{t("l_otp_code")}</Label>
                        <Input
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                        />
                      </div>
                      <Button type="button" variant="outline" disabled={otpVerifying || otpCode.length !== 6} onClick={verifyOtp}>
                        {otpVerifying ? t("otp_verifying") : t("otp_verify")}
                      </Button>
                    </div>
                  </>
                )}
                {emailToken && (
                  <div className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3.5 py-2.5 text-sm text-brand-green">
                    {t("otp_verified")} - {otpEmail.trim()}
                  </div>
                )}
              </>
            )}
          </fieldset>

          {!member && (
            <fieldset className="space-y-4">
              <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("lg_account")}</legend>
              <p className="text-[12.5px] text-muted-foreground">{t("acc_hint")}</p>
              <div className="grid gap-3.5 md:grid-cols-2">
                <Field label={t("l_username")}>
                  <Input
                    value={username}
                    autoComplete="username"
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("ph_username")}
                  />
                </Field>
                <Field label={t("l_password")}>
                  <Input
                    type="password"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              </div>
            </fieldset>
          )}

          <div className="rounded-lg border border-maroon/15 bg-maroon/5 px-4 py-3">
            <div className="text-[13px] font-bold uppercase tracking-wide text-maroon">{t("about_profile_h")}</div>
            <p className="text-[12.5px] text-muted-foreground">{t("about_profile_sub")}</p>
          </div>

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
                <Select
                  value={form.createdFor}
                  onValueChange={(v) => {
                    const val = v ?? "Self";
                    set("createdFor", val);
                    // Self needs no submitter consent; a later on-behalf choice re-collects it.
                    if (val === "Self") setSubmitterConsent(null);
                    else if (agree && !submitterConsent) setConsentOpen(true);
                  }}
                >
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
              <Field label={t("l_mobile2")}>
                <div className="flex gap-2">
                  <Select value={dialCode2} onValueChange={(v) => updateMobile2(v ?? "+971", phone2)}>
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
                    maxLength={phoneMax(dialCode2) || undefined}
                    className="flex-1"
                    value={phone2}
                    onChange={(e) => updateMobile2(dialCode2, e.target.value)}
                    placeholder={dialCode2 === "+91" ? "9876543210" : "501234567"}
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
                    // Auto-select who they're looking for: Male -> Bride, Female -> Groom.
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
              {form.congregation === "Other" && (
                <>
                  <Field label={`${t("l_referee_name")} *`} className="md:col-start-1">
                    <Input value={form.refereeName ?? ""} onChange={(e) => set("refereeName", e.target.value)} placeholder={t("ph_referee_name")} />
                  </Field>
                  <Field label={`${t("l_referee_contact")} *`}>
                    <Input value={form.refereeContact ?? ""} onChange={(e) => set("refereeContact", e.target.value)} placeholder={t("ph_referee_contact")} />
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

          <fieldset className="space-y-3">
            <legend className="mb-2 w-full border-b pb-1.5 text-[15px] font-bold text-maroon">{t("tc_h")}</legend>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-[12.5px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Church Matrimonial Portal Disclaimer</p>
              <p>
                This Matrimonial Portal is provided solely as a facilitation service for members seeking suitable
                matrimonial alliances. The Church acts only as a platform provider in listing.
              </p>
              <p>
                The Church does not guarantee the accuracy, completeness, character, compatibility, suitability, financial
                status, educational qualifications, family background, or intentions of any individual registered on the
                portal.
              </p>
              <p>
                Any communication, meeting, engagement, marriage proposal, or matrimonial decision arising from
                interactions on this portal is entirely the responsibility of the individuals and families involved.
              </p>
              <p>Users are advised to independently verify all information before making any commitment or decision.</p>
              <p>
                The Church, its Chairman, staff, committee members, and volunteers shall not be held liable for any
                disputes, misunderstandings, financial loss, emotional distress, legal claims, or consequences arising from
                the use of this service.
              </p>
              <p>
                By registering on this portal, users acknowledge and agree that all matrimonial decisions are made
                voluntarily and independently by the concerned parties.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAgree(checked);
                  // Right after agreeing to the T&C, an on-behalf submitter completes the consent popup.
                  if (checked && form.createdFor !== "Self" && !submitterConsent) setConsentOpen(true);
                }}
                className="mt-0.5 size-4 accent-[maroon]"
              />
              <span>{t("tc_agree")}</span>
            </label>
            {form.createdFor !== "Self" && submitterConsent && (
              <p className="text-[12.5px] font-medium text-brand-green">
                ✓ Submitter consent recorded ({submitterConsent.name}).{" "}
                <button type="button" onClick={() => setConsentOpen(true)} className="font-semibold underline">Edit</button>
              </p>
            )}
            {form.createdFor !== "Self" && agree && !submitterConsent && (
              <p className="text-[12.5px] font-medium text-amber-700">
                Submitter consent is required before you can submit.{" "}
                <button type="button" onClick={() => setConsentOpen(true)} className="font-semibold underline">Complete it</button>
              </p>
            )}
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={saving || !identityOk || !agree}
              className="bg-gold text-maroon hover:bg-gold! hover:brightness-105"
            >
              {saving ? t("submitting") : t("submit_btn")}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setForm(empty); setSalaryAmount(""); setCurrency("AED"); setSiblings([]); setSubmitter(emptySubmitter); setSubmitterConsent(null); }}>
              {t("reset_btn")}
            </Button>
          </div>
        </form>
      </Card>

      {/* Mandatory consent form - shown only when registering on behalf of someone else. */}
      <Dialog open={consentOpen} onOpenChange={(o) => { if (!saving) setConsentOpen(o); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Details of the person submitting the form</DialogTitle>
            <DialogDescription>
              You are creating this profile on behalf of the bride/groom. Please complete this consent form before you submit the profile - all fields are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <Field label="Relationship to the bride/groom *">
              <Select value={submitter.relationship} onValueChange={(v) => setSub("relationship", v ?? "Father")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Father", "Mother", "Brother", "Sister", "Relative", "Friend", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {submitter.relationship === "Other" && (
              <Field label="Please specify *">
                <Input value={submitter.relationshipOther} onChange={(e) => setSub("relationshipOther", e.target.value)} placeholder="Your relationship" />
              </Field>
            )}

            <Field label="Full name of the person submitting the form *">
              <Input value={submitter.name} onChange={(e) => setSub("name", e.target.value)} />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Mobile / WhatsApp number *">
                <Input type="tel" value={submitter.mobile} onChange={(e) => setSub("mobile", e.target.value)} placeholder="e.g. +971 50 123 4567" />
              </Field>
              <Field label="Email address *">
                <Input type="email" value={submitter.email} onChange={(e) => setSub("email", e.target.value)} placeholder="name@example.com" />
              </Field>
              <Field label="Country of residence *">
                <Input value={submitter.country} onChange={(e) => setSub("country", e.target.value)} placeholder="e.g. United Arab Emirates" />
              </Field>
              <Field label="City / Emirate / State / District *">
                <Input value={submitter.city} onChange={(e) => setSub("city", e.target.value)} placeholder="e.g. Dubai" />
              </Field>
            </div>
            <Field label="Church membership details *">
              <Input value={submitter.churchMembership} onChange={(e) => setSub("churchMembership", e.target.value)} placeholder="Parish / congregation / membership no." />
            </Field>

            <Field label="Preferred method of communication *">
              <Select value={submitter.preferredContact} onValueChange={(v) => setSub("preferredContact", v ?? "Contact either of us")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contact the Bride/Groom directly">Contact the Bride/Groom directly</SelectItem>
                  <SelectItem value="Contact the person who submitted the form">Contact the person who submitted the form</SelectItem>
                  <SelectItem value="Contact either of us">Contact either of us</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3.5">
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed">
                <input type="checkbox" checked={submitter.declaration} onChange={(e) => setSub("declaration", e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[maroon]" />
                <span>I am submitting this matrimonial profile on behalf of the Bride/Groom named above, with their knowledge and consent, and I confirm that the information provided is true to the best of my knowledge.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed">
                <input type="checkbox" checked={submitter.consent} onChange={(e) => setSub("consent", e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[maroon]" />
                <span>I confirm that the Bride/Groom has given permission for this matrimonial profile and the information provided to be used for the purpose of matrimonial introductions through the Church Matrimonial Ministry.</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConsentOpen(false)}>{t("ei_cancel")}</Button>
            <Button
              type="button"
              onClick={submitConsent}
              className="bg-gold text-maroon hover:bg-gold! hover:brightness-105"
            >
              Confirm consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

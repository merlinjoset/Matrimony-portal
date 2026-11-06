"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { parseSiblings } from "@/lib/siblings";
import type { OwnProfileDetail } from "@/lib/types";

/**
 * Printable one-page profile resume (bio-data) for a single listing, used by the admin-only
 * /admin/members/[id]/print route (gated server-side by the admin layout). Deliberately one
 * profile at a time - there is no bulk print. Admin-only verification data (presbyter/referee/
 * local-reference contacts, consent form, membership no.) is never printed; contact details and
 * the photo are optional and chosen per print.
 */

/** Parses "yyyy-MM-dd" as a local calendar date (new Date("yyyy-MM-dd") is UTC and can shift a day). */
function localDate(ymd: string | null): Date | null {
  const m = ymd?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}
function ageFrom(dob: string | null): number | null {
  const d = localDate(dob);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
const CREATED_BY: Record<string, string> = { Self: "Self", Son: "Parents", Daughter: "Parents", Brother: "Sibling", Sister: "Sibling", Other: "Family / friend" };

function Field({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) {
  if (!value || !String(value).trim()) return null;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-[#8a7a6a]">{label}</dt>
      <dd className="whitespace-pre-line text-[13px] leading-snug text-[#2c2522]">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-2 border-b border-[#c2a04a] pb-1 text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#8a2a38]">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</dl>
    </section>
  );
}

export function ProfileResume({ p, backHref }: { p: OwnProfileDetail; backHref: string }) {
  const [withPhoto, setWithPhoto] = useState(true);
  const [withContact, setWithContact] = useState(false);

  // The document title becomes the suggested file name when saving as PDF.
  useEffect(() => {
    const prev = document.title;
    document.title = `Resume ${p.referenceId} ${p.fullName}`;
    return () => { document.title = prev; };
  }, [p.referenceId, p.fullName]);

  const dob = localDate(p.dateOfBirth);
  const age = ageFrom(p.dateOfBirth);
  const role = p.gender === "Female" ? "Bride" : "Groom";
  const verified = p.status === "Verified" || p.status === "Active";
  const sib = parseSiblings(p.siblingsDetails);
  const siblingsText = !sib
    ? null
    : typeof sib === "string"
      ? sib
      : sib.map((s) => [s.name, s.status && `(${s.status})`, s.occupation && `- ${s.occupation}`].filter(Boolean).join(" ")).join("\n");
  const parent = (name: string | null, occ: string | null) => [name, occ && `(${occ})`].filter(Boolean).join(" ") || null;

  return (
    <div className="p-6 print:p-0">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body, .bg-cream { background: #fff !important; }
          .resume { box-shadow: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Toolbar - screen only */}
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-4 rounded-lg border border-border bg-white px-4 py-3 text-sm print:hidden">
        <Link href={backHref} className="font-semibold text-maroon">← Back to profile</Link>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} className="accent-[maroon]" /> Include photo
        </label>
        <label className="flex cursor-pointer items-center gap-2" title="Contact numbers and email are normally shared only after the member approves a request">
          <input type="checkbox" checked={withContact} onChange={(e) => setWithContact(e.target.checked)} className="accent-[maroon]" /> Include contact details
        </label>
        <Button size="sm" onClick={() => window.print()} className="ml-auto bg-maroon text-white hover:bg-maroon/90">🖨️ Print / Save as PDF</Button>
      </div>

      {/* The A4 sheet */}
      <article className="resume mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] text-[#2c2522] shadow-lg print:min-h-0 print:max-w-none print:p-0">
        <header className="flex items-center gap-4 border-b-2 border-[#8a2a38] pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/parish-logo.png" alt="CSI Tamil Parish Dubai" className="h-16 w-16" />
          <div className="flex-1">
            <div className="text-[18px] font-bold text-[#8a2a38]">CSI Tamil Parish, Dubai</div>
            <div className="text-[12px] tracking-wide text-[#6b6b6b]">CSI Holy Matrimony · Profile Resume</div>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-bold text-[#8a2a38]">{p.referenceId}</div>
            <div className="text-[11px] text-[#6b6b6b]">Printed {longDate(new Date())}</div>
            <div className={`mt-0.5 text-[11px] font-bold ${verified ? "text-[#3f6b54]" : "text-[#b45309]"}`}>
              {verified ? "✓ Verified by the parish" : `Status: ${p.status}${p.status === "Pending" ? " (not yet verified)" : ""}`}
            </div>
          </div>
        </header>

        <div className="mt-5 flex gap-5">
          {withPhoto && p.mainPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.mainPhotoUrl} alt={p.fullName} className="h-[46mm] w-[37mm] shrink-0 rounded-md border-2 border-[#c2a04a] object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-bold leading-tight text-[#15224c]">{p.fullName}</h1>
            <p className="mt-0.5 text-[13.5px] text-[#5c6377]">
              {[role, age != null ? `${age} years` : null, p.height, p.city].filter(Boolean).join(" · ")}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              <Field label="Date of birth" value={dob ? longDate(dob) : null} />
              <Field label="Marital status" value={p.maritalStatus} />
              <Field label="Mother tongue" value={p.motherTongue} />
              <Field label="Caste" value={p.caste === "Caste No Bar" ? "Caste no bar" : p.caste} />
              <Field label="Native place" value={p.nativePlace} />
              <Field label="Profile created by" value={CREATED_BY[p.createdFor] ?? p.createdFor} />
            </dl>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <Section title="Faith & church">
            <Field label="Denomination" value={p.denomination} />
            <Field label="Congregation" value={p.congregation} />
            <Field label="Home parish / church" value={p.homeParish} wide />
            <Field label="Walk of faith" value={p.aboutFaith} wide />
          </Section>

          <Section title="Family">
            <Field label="Father" value={parent(p.fatherName, p.fatherOccupation)} />
            <Field label="Mother" value={parent(p.motherName, p.motherOccupation)} />
            <Field label="Siblings" value={siblingsText} wide />
          </Section>

          <Section title="Education & profession">
            <Field label="Highest education" value={p.education} />
            <Field label="Profession" value={p.profession} />
            <Field label="Company" value={p.company} />
            <Field label="Working at" value={p.workLocation} />
            <Field label="Salary" value={p.salary} />
          </Section>

          <Section title="Partner expectations">
            <Field label="Expectations" value={p.expectations} wide />
            <Field label="Preferred caste" value={p.partnerCaste === "Caste No Bar" ? "Caste no bar" : p.partnerCaste} />
            <Field label="Preferred denomination" value={p.partnerDenomination === "Any" ? "Any denomination" : p.partnerDenomination} />
            <Field label="Preferred education" value={p.partnerEducation} />
            <Field label="Preferred profession" value={p.partnerProfession} />
          </Section>

          {withContact && (
            <Section title="Contact">
              <Field label="Mobile" value={p.mobile} />
              <Field label="Alternate mobile" value={p.mobile2} />
              <Field label="Email" value={p.email} wide />
            </Section>
          )}
        </div>

        <footer className="mt-8 border-t border-[#e6e0d8] pt-3 text-center text-[10.5px] leading-relaxed text-[#9a8f84]">
          Confidential. Prepared by the CSI Tamil Parish, Dubai office for matrimonial purposes only; please do not copy or share further.
        </footer>
      </article>
    </div>
  );
}

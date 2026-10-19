/**
 * Which key profile details a member's edit changed. Changing any of these sends the listing back
 * through parish verification, because the approvals were given for the old values; other edits
 * keep the approvals already given. Key details: name, date of birth, gender, mobile numbers, email
 * and presbyter contact. (The membership number is also key, but members cannot edit it.)
 *
 * Formatting differences are ignored: case and spacing for names, gender and emails, and phone
 * numbers are compared by their last 9 digits, so "+971 501234567" and "0501234567" count as the
 * same number. The presbyter contact is free text (a phone or an email) and is compared the same way.
 *
 * Deliberately free of server-only imports so it can be unit-tested with plain Node.
 */
export interface VerificationKeyFields {
  fullName: string | null | undefined;
  dateOfBirth: string | null | undefined; // "yyyy-mm-dd"
  gender: string | null | undefined;
  mobile: string | null | undefined;
  mobile2: string | null | undefined;
  email: string | null | undefined;
  presbyterContact: string | null | undefined;
}

const name = (v: string | null | undefined) => (v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const text = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
const date = (v: string | null | undefined) => (v ?? "").trim().slice(0, 10);
const phone = (v: string | null | undefined) => (v ?? "").replace(/[^0-9]/g, "").slice(-9);
const email = (v: string | null | undefined) => (v ?? "").replace(/\s+/g, "").toLowerCase();
/** Free-text contact: an email (compared without case/spaces), a phone (last 9 digits), or other text. */
const contact = (v: string | null | undefined) => {
  const s = (v ?? "").trim().toLowerCase();
  if (s.includes("@")) return email(s);
  const digits = s.replace(/[^0-9]/g, "");
  return digits.length >= 7 ? digits.slice(-9) : s.replace(/\s+/g, " ");
};

/** The key fields that differ between `before` and `after`, as readable labels (empty = no key change). */
export function verificationKeyChanges(before: VerificationKeyFields, after: VerificationKeyFields): string[] {
  const changed: string[] = [];
  if (name(before.fullName) !== name(after.fullName)) changed.push("name");
  if (date(before.dateOfBirth) !== date(after.dateOfBirth)) changed.push("date of birth");
  if (text(before.gender) !== text(after.gender)) changed.push("gender");
  if (phone(before.mobile) !== phone(after.mobile)) changed.push("mobile");
  if (phone(before.mobile2) !== phone(after.mobile2)) changed.push("alternate mobile");
  if (email(before.email) !== email(after.email)) changed.push("email");
  if (contact(before.presbyterContact) !== contact(after.presbyterContact)) changed.push("presbyter contact");
  return changed;
}

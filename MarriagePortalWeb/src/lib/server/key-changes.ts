/**
 * Which key profile details a member's edit changed. Changing any of these sends the listing back
 * through parish verification, because the approvals were given for the old values; other edits
 * keep the approvals already given. (The membership number is also key, but members cannot edit it.)
 *
 * Formatting differences are ignored: case and spacing for name and gender, and phone numbers are
 * compared by their last 9 digits, so "+971 501234567" and "0501234567" count as the same number.
 *
 * Deliberately free of server-only imports so it can be unit-tested with plain Node.
 */
export interface VerificationKeyFields {
  fullName: string | null | undefined;
  dateOfBirth: string | null | undefined; // "yyyy-mm-dd"
  gender: string | null | undefined;
  mobile: string | null | undefined;
  mobile2: string | null | undefined;
}

const name = (v: string | null | undefined) => (v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const text = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
const date = (v: string | null | undefined) => (v ?? "").trim().slice(0, 10);
const phone = (v: string | null | undefined) => (v ?? "").replace(/[^0-9]/g, "").slice(-9);

/** The key fields that differ between `before` and `after`, as readable labels (empty = no key change). */
export function verificationKeyChanges(before: VerificationKeyFields, after: VerificationKeyFields): string[] {
  const changed: string[] = [];
  if (name(before.fullName) !== name(after.fullName)) changed.push("name");
  if (date(before.dateOfBirth) !== date(after.dateOfBirth)) changed.push("date of birth");
  if (text(before.gender) !== text(after.gender)) changed.push("gender");
  if (phone(before.mobile) !== phone(after.mobile)) changed.push("mobile");
  if (phone(before.mobile2) !== phone(after.mobile2)) changed.push("alternate mobile");
  return changed;
}

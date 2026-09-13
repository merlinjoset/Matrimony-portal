import { CURRENCIES } from "./types";

const CODES = CURRENCIES as readonly string[];

/** Split a stored salary like "AED 12,000" into a currency code + amount. Defaults the code to AED. */
export function splitSalary(salary: string | null | undefined): { currency: string; amount: string } {
  const raw = (salary ?? "").trim();
  if (!raw) return { currency: "AED", amount: "" };
  const sp = raw.indexOf(" ");
  if (sp > 0) {
    const code = raw.slice(0, sp);
    if (CODES.includes(code)) return { currency: code, amount: raw.slice(sp + 1).trim() };
  }
  return { currency: "AED", amount: raw };
}

/** Combine a currency code + amount back into the stored salary string ("" when no amount). */
export function joinSalary(currency: string, amount: string): string {
  const amt = amount.trim();
  return amt ? `${currency} ${amt}` : "";
}

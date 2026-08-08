import "server-only";
import type { ProfileDetail } from "@/lib/types";
import { sendAdminMail } from "./mailer";
import { getEmailSettings } from "./settings";

/** Build a WhatsApp click-to-chat link to a phone number, with an optional prefilled message. */
export function whatsappLink(mobile: string | null, message: string): string | null {
  if (!mobile) return null;
  const digits = mobile.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Notify the parish office that a new profile has been submitted for verification.
 * Includes the profile summary, a link to the admin verification queue, and a WhatsApp
 * click-to-chat link so the office can reach the applicant in one tap. Never throws.
 */
export async function notifyNewProfile(profile: ProfileDetail, mobile: string | null): Promise<void> {
  const cfg = await getEmailSettings();
  const baseUrl = cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com";
  const waMsg = `Hello ${profile.fullName}, this is CSI Tamil Parish Matrimony regarding your profile ${profile.referenceId}.`;
  const waHref = whatsappLink(mobile, waMsg);

  const rows: [string, string | null][] = [
    ["Reference", profile.referenceId],
    ["Name", profile.fullName],
    ["Created for / Looking for", `${profile.createdFor} / ${profile.lookingFor}`],
    ["Gender", profile.gender],
    ["Age", profile.age != null ? String(profile.age) : null],
    ["Denomination", profile.denomination],
    ["Congregation", profile.congregation],
    ["Mobile", mobile],
    ["Email", profile.email],
  ];

  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;">${k}</td><td style="padding:4px 0;font-weight:600;">${v}</td></tr>`)
    .join("");

  const verifyUrl = `${baseUrl}/admin/verify`;
  const waButton = waHref
    ? `<a href="${waHref}" style="display:inline-block;margin-right:10px;padding:10px 16px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Message on WhatsApp</a>`
    : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#2c2522;">
      <h2 style="color:#8a2a38;margin:0 0 4px;">New profile awaiting verification</h2>
      <p style="color:#6b6b6b;margin:0 0 16px;">A member has submitted a matrimony profile. Please review it in the admin panel.</p>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">${rowsHtml}</table>
      <div>
        ${waButton}
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open verification queue</a>
      </div>
      <p style="color:#9a8f84;font-size:12px;margin-top:22px;">CSI Holy Matrimony - CSI Tamil Parish, Dubai</p>
    </div>`;

  await sendAdminMail({
    subject: `New profile for verification: ${profile.fullName} (${profile.referenceId})`,
    html,
  });
}

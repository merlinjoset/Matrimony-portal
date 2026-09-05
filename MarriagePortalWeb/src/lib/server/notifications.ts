import "server-only";
import type { ProfileDetail } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/types";
import type { ReverifyDue } from "./queries";
import { sendAdminMail, sendMail } from "./mailer";
import { getEmailSettings } from "./settings";
import { getApproverContacts } from "./approvers";

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

/**
 * Tell the approvers assigned to `level` that a profile is now awaiting their checklist review.
 * Emails each assigned approver individually; if a level has no assignees, it falls back to the
 * parish-office address so nothing is missed. Never throws.
 */
export async function notifyLevelApprovers(profile: ProfileDetail, level: number): Promise<void> {
  try {
    const cfg = await getEmailSettings();
    const baseUrl = cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com";
    const label = LEVEL_LABEL[level] ?? `Level ${level}`;
    const verifyUrl = `${baseUrl}/admin/verify`;
    const subject = `Action needed - ${label} for ${profile.fullName} (${profile.referenceId})`;

    const rows: [string, string | null][] = [
      ["Reference", profile.referenceId],
      ["Name", profile.fullName],
      ["Gender", profile.gender],
      ["Denomination", profile.denomination],
      ["Congregation", profile.congregation],
    ];
    const rowsHtml = rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b;">${k}</td><td style="padding:4px 0;font-weight:600;">${v}</td></tr>`)
      .join("");

    const body = (greeting: string) => `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#2c2522;">
        <h2 style="color:#8a2a38;margin:0 0 4px;">${label} needed</h2>
        <p style="color:#6b6b6b;margin:0 0 16px;">${greeting} A matrimony profile is waiting for your <strong>${label}</strong>. Please open it, complete the checklist, and approve to pass it to the next level.</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">${rowsHtml}</table>
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open the verification queue</a>
        <p style="color:#9a8f84;font-size:12px;margin-top:22px;">CSI Holy Matrimony - CSI Tamil Parish, Dubai</p>
      </div>`;

    const approvers = await getApproverContacts(level);
    if (approvers.length === 0) {
      await sendAdminMail({ subject, html: body("Hello,") });
      return;
    }
    for (const a of approvers) {
      await sendMail({ to: a.email, subject, html: body(`Hello ${a.name},`) });
    }
  } catch (err) {
    console.error("[notifications] notifyLevelApprovers failed:", err);
  }
}

/**
 * Remind the parish office that some listings passed their 6-month re-verification date.
 * Returns true if an email was sent. Never throws.
 */
export async function notifyReverifyDue(profiles: ReverifyDue[]): Promise<boolean> {
  if (!profiles.length) return false;
  const cfg = await getEmailSettings();
  const baseUrl = cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com";

  const rowsHtml = profiles
    .map((p) => {
      const since = new Date(p.lastVerifiedAt).toLocaleDateString();
      return `<tr>
        <td style="padding:5px 14px 5px 0;font-weight:600;">${p.fullName}</td>
        <td style="padding:5px 14px 5px 0;color:#6b6b6b;">${p.referenceId}</td>
        <td style="padding:5px 14px 5px 0;color:#6b6b6b;">${p.congregation}</td>
        <td style="padding:5px 0;color:#6b6b6b;">verified ${since}</td>
      </tr>`;
    })
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#2c2522;">
      <h2 style="color:#8a2a38;margin:0 0 4px;">${profiles.length} listing${profiles.length === 1 ? "" : "s"} due for re-verification</h2>
      <p style="color:#6b6b6b;margin:0 0 16px;">
        These profiles have been live for more than 6 months. Please review each one and re-verify it if it is still valid,
        or suspend / mark it committed if it is no longer active.
      </p>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">${rowsHtml}</table>
      <a href="${baseUrl}/admin/members" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open Profiles in admin</a>
      <p style="color:#9a8f84;font-size:12px;margin-top:22px;">CSI Holy Matrimony - CSI Tamil Parish, Dubai. Re-verifying a listing resets its clock for another 6 months.</p>
    </div>`;

  return await sendAdminMail({
    subject: `${profiles.length} matrimony listing${profiles.length === 1 ? "" : "s"} due for re-verification`,
    html,
  });
}

import "server-only";
import type { ContactRequest, Interest, ProfileDetail } from "@/lib/types";
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
 * Wrap email body content in the parish's branded shell: the CSI Tamil Parish Dubai logo header
 * and the standard footer. One place owns the logo and footer so every email stays consistent.
 * `footerNote` appends an extra sentence after the parish name (e.g. a privacy reminder).
 */
function emailShell(baseUrl: string, innerHtml: string, footerNote?: string): string {
  const footer = "CSI Holy Matrimony - CSI Tamil Parish, Dubai" + (footerNote ? `. ${footerNote}` : "");
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#2c2522;">
      <div style="text-align:center;margin-bottom:18px;">
        <img src="${baseUrl}/parish-logo.png" alt="CSI Tamil Parish Dubai" width="92" height="89" style="display:inline-block;border:0;">
      </div>
      ${innerHtml}
      <p style="color:#9a8f84;font-size:12px;margin-top:22px;border-top:1px solid #eee;padding-top:12px;">${footer}</p>
    </div>`;
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

  const html = emailShell(baseUrl, `
      <h2 style="color:#8a2a38;margin:0 0 4px;">New profile awaiting verification</h2>
      <p style="color:#6b6b6b;margin:0 0 16px;">A member has submitted a matrimony profile. Please review it in the admin panel.</p>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">${rowsHtml}</table>
      <div>
        ${waButton}
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open verification queue</a>
      </div>`);

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

    const body = (greeting: string) => emailShell(baseUrl, `
        <h2 style="color:#8a2a38;margin:0 0 4px;">${label} needed</h2>
        <p style="color:#6b6b6b;margin:0 0 16px;">${greeting} A matrimony profile is waiting for your <strong>${label}</strong>. Please open it, complete the checklist, and approve to pass it to the next level.</p>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">${rowsHtml}</table>
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open the verification queue</a>`);

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

/** Tell the profile owner their listing has been verified and is now live. Never throws. */
export async function notifyProfileVerified(profile: ProfileDetail, to: string): Promise<void> {
  try {
    const cfg = await getEmailSettings();
    const baseUrl = cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com";
    const html = emailShell(baseUrl, `
        <h2 style="color:#3f6b54;margin:0 0 6px;">Your profile is verified &#10003;</h2>
        <p style="color:#6b6b6b;margin:0 0 16px;">Good news, ${profile.fullName}. Your matrimony listing <strong>${profile.referenceId}</strong> has completed the parish verification and is now live for other members to view.</p>
        <a href="${baseUrl}/profiles/${profile.id}" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View your profile</a>`);
    await sendMail({ to, subject: `Your profile is verified - ${profile.referenceId}`, html });
  } catch (err) {
    console.error("[notifications] notifyProfileVerified failed:", err);
  }
}

/**
 * Send a verifier's own message to the applicant from the verification screen - used when the
 * verifier cannot reach the applicant by phone and needs them to correct their contact details.
 * The verifier composes the text; this wraps it in the parish's branded shell. Never throws.
 */
export async function sendApplicantMessage(to: string, subject: string, message: string): Promise<boolean> {
  try {
    const cfg = await getEmailSettings();
    const baseUrl = cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com";
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const bodyHtml = esc(message)
      .split(/\n{2,}/)
      .map((para) => `<p style="margin:0 0 12px;line-height:1.5;">${para.replace(/\n/g, "<br>")}</p>`)
      .join("");
    const html = emailShell(baseUrl, bodyHtml);
    return await sendMail({ to, subject, html, text: message });
  } catch (err) {
    console.error("[notifications] sendApplicantMessage failed:", err);
    return false;
  }
}

/** Tell the profile owner that someone has requested to view their contact number OR photo. Never throws. */
export async function notifyContactRequested(req: ContactRequest, to: string): Promise<void> {
  try {
    const cfg = await getEmailSettings();
    const baseUrl = cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com";
    const from = req.requesterCongregation ? `${req.requesterName} (${req.requesterCongregation})` : req.requesterName;
    const what = req.requestType === "Photo" ? "view the photo" : "see the contact number";
    const subjectWhat = req.requestType === "Photo" ? "photo request" : "contact request";
    const html = emailShell(baseUrl, `
        <h2 style="color:#8a2a38;margin:0 0 6px;">New request to connect</h2>
        <p style="color:#6b6b6b;margin:0 0 16px;"><strong>${from}</strong> has requested to ${what} for your listing <strong>${req.profileName}</strong> (${req.profileReferenceId}). Please review the request and approve or decline it.</p>
        <a href="${baseUrl}/requests" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open your requests</a>`, "It is shared only after you approve.");
    await sendMail({ to, subject: `New ${subjectWhat} for ${req.profileName}`, html });
  } catch (err) {
    console.error("[notifications] notifyContactRequested failed:", err);
  }
}

/**
 * Tell a listing's family, in matrimony terms, that the other side's family is interested ("A
 * groom's family is interested in your daughter", or the reverse), introduce that bride/groom
 * briefly, and ask them to reply to the email. Sent from the admin Interests list. No phone number,
 * email or the enquirer's own message is included: contact details are shared only once both
 * families agree. Returns true if the email was sent. Never throws.
 */
export async function sendInterestReminder(i: Interest, to: string, target: ProfileDetail, enquirer: ProfileDetail | null): Promise<boolean> {
  try {
    const cfg = await getEmailSettings();
    const { subject, html } = interestReminderEmail(i, target, enquirer, cfg.appBaseUrl || "https://matrimony.csitamilparishdubai.com");
    return await sendMail({ to, subject, html });
  } catch (err) {
    console.error("[notifications] sendInterestReminder failed:", err);
    return false;
  }
}

/** How the parish office refers to the listed person when writing to the family that listed them. */
const RELATION: Record<string, string> = { Son: "your son", Daughter: "your daughter", Brother: "your brother", Sister: "your sister" };

/**
 * Subject and body of the interest email (kept separate so it can be previewed without sending).
 * `target` is the listing the interest was sent to (its family receives this email); `enquirer` is
 * the interested side's own listing, if known.
 */
export function interestReminderEmail(
  i: Interest,
  target: Pick<ProfileDetail, "fullName" | "gender" | "createdFor">,
  enquirer: ProfileDetail | null,
  baseUrl: string,
): { subject: string; html: string } {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const when = new Date(i.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  // Brides and grooms only ever match the opposite gender, so the interested side is the other role.
  const side = target.gender === "Female" ? "groom" : "bride";
  const isSelf = target.createdFor === "Self";
  const relation = RELATION[target.createdFor];
  const targetName = `<strong>${esc(target.fullName)}</strong> (${esc(i.toReferenceId)})`;
  const targetPhrase = isSelf ? `you, ${targetName}` : relation ? `${relation} ${targetName}` : targetName;
  const headingWho = isSelf ? "you" : relation ?? esc(target.fullName);
  const greeting = isSelf ? `Dear ${esc(target.fullName)},` : `Dear family of ${esc(target.fullName)},`;

  const who = enquirer
    ? `the family of the ${side} <strong>${esc(enquirer.fullName)}</strong> (${esc(i.fromReferenceId ?? "")})`
    : `the family of a ${side}, <strong>${esc(i.fromName)}</strong>,`;

  // A short introduction to the interested bride/groom - only what any approved member can already
  // see on their profile (never contact details, DOB or family names).
  let card = "";
  if (enquirer) {
    const rows: [string, string | null][] = [
      ["Name", enquirer.fullName],
      ["Age", [enquirer.age != null ? `${enquirer.age} years` : null, enquirer.height].filter(Boolean).join(" · ") || null],
      ["Education", enquirer.education],
      ["Profession", enquirer.profession],
      ["Working in", enquirer.workLocation || enquirer.city],
      ["Native place", enquirer.nativePlace],
      ["Church", [enquirer.denomination, enquirer.congregation].filter(Boolean).join(" · ") || null],
    ];
    const rowsHtml = rows
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#8a7a6a;white-space:nowrap;vertical-align:top;">${k}</td><td style="padding:4px 0;font-weight:600;">${esc(String(v).replace(/\s+/g, " ").replace(/ ,/g, ",").trim())}</td></tr>`)
      .join("");
    card = `
      <div style="border:1px solid #e6d9b8;background:#fbf7ee;border-radius:10px;padding:14px 16px;margin:0 0 16px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8a2a38;margin-bottom:6px;">About the ${side}</div>
        <table style="border-collapse:collapse;font-size:14px;">${rowsHtml}</table>
      </div>`;
  }
  const sentBy = enquirer && i.fromName.trim().toLowerCase() !== enquirer.fullName.trim().toLowerCase()
    ? ` The enquiry was sent by ${esc(i.fromName)} on ${when}.`
    : ` The enquiry was sent on ${when}.`;
  const viewBtn = i.fromProfileId
    ? `<a href="${baseUrl}/profiles/${i.fromProfileId}" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View the ${side}'s profile</a>`
    : "";

  const html = emailShell(baseUrl, `
      <h2 style="color:#8a2a38;margin:0 0 10px;">A ${side}'s family is interested in ${headingWho}</h2>
      <p style="margin:0 0 10px;">${greeting}</p>
      <p style="color:#4a4440;margin:0 0 14px;line-height:1.5;">Greetings! We are happy to let you know that ${who} has shown interest in ${targetPhrase} and would like to take this forward.${sentBy}</p>
      ${card}
      <p style="color:#4a4440;margin:0 0 16px;line-height:1.5;">If you are also interested, please reply to this email. If not, a short reply is appreciated too, so the ${side}'s family can be informed kindly. Contact details are shared only when both families agree.</p>
      ${viewBtn}
      <p style="color:#4a4440;margin:18px 0 0;">With prayers and best wishes,<br>CSI Holy Matrimony</p>`);
  return { subject: `A ${side}'s family is interested in ${target.fullName} (${i.toReferenceId})`, html };
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

  const html = emailShell(baseUrl, `
      <h2 style="color:#8a2a38;margin:0 0 4px;">${profiles.length} listing${profiles.length === 1 ? "" : "s"} due for re-verification</h2>
      <p style="color:#6b6b6b;margin:0 0 16px;">
        These profiles have been live for more than 6 months. Please review each one and re-verify it if it is still valid,
        or suspend / mark it committed if it is no longer active.
      </p>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">${rowsHtml}</table>
      <a href="${baseUrl}/admin/members" style="display:inline-block;padding:10px 16px;background:#8a2a38;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Open Profiles in admin</a>`, "Re-verifying a listing resets its clock for another 6 months.");

  return await sendAdminMail({
    subject: `${profiles.length} matrimony listing${profiles.length === 1 ? "" : "s"} due for re-verification`,
    html,
  });
}

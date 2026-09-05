import "server-only";
import { sql } from "./db";
import { getApprovalChecklist } from "./checklist";
import { canApproveLevel } from "./approvers";
import type {
  AdminUser,
  CreateInterestInput,
  CreateProfileInput,
  CreateUserInput,
  Interest,
  ContactRequest,
  ContactReveal,
  MemberValidation,
  PagedResult,
  ProfileDetail,
  ProfileListItem,
  ProfileStats,
} from "@/lib/types";

// ---------- helpers ----------
function computeAge(dob: unknown): number | null {
  if (!dob) return null;
  const d = new Date(dob as string);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age >= 0 ? age : null;
}

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? null : String(v));

function toListItem(r: Row): ProfileListItem {
  return {
    id: r.Id as string,
    referenceId: r.ReferenceId as string,
    fullName: r.FullName as string,
    gender: r.Gender as ProfileListItem["gender"],
    age: computeAge(r.DateOfBirth),
    height: s(r.Height),
    denomination: r.Denomination as string,
    congregation: r.Congregation as string,
    education: s(r.Education),
    profession: s(r.Profession),
    city: s(r.City),
    mainPhotoUrl: s(r.MainPhotoUrl),
    status: r.Status as ProfileListItem["status"],
  };
}

function toDetail(r: Row): ProfileDetail {
  return {
    ...toListItem(r),
    createdFor: r.CreatedFor as string,
    lookingFor: r.LookingFor as string,
    email: s(r.Email),
    maritalStatus: r.MaritalStatus as string,
    motherTongue: r.MotherTongue as string,
    homeParish: r.HomeParish as string,
    aboutFaith: s(r.AboutFaith),
    expectations: s(r.Expectations),
    fatherOccupation: s(r.FatherOccupation),
    motherOccupation: s(r.MotherOccupation),
    statusNote: s(r.StatusNote),
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  };
}

const LIST_COLS = sql`"Id","ReferenceId","FullName","Gender","DateOfBirth","Height","Denomination","Congregation","Education","Profession","City","MainPhotoUrl","Status"`;
const DETAIL_COLS = sql`"Id","ReferenceId","CreatedFor","LookingFor","Email","FullName","Gender","DateOfBirth","Height","MaritalStatus","MotherTongue","Denomination","HomeParish","Congregation","AboutFaith","Expectations","Education","Profession","City","FatherOccupation","MotherOccupation","MainPhotoUrl","Status","StatusNote","CreatedAt"`;

// ---------- profiles ----------
export interface ProfileQuery {
  gender?: string;
  denomination?: string | string[];
  congregation?: string | string[];
  status?: string;
  live?: boolean;
  page?: number;
  pageSize?: number;
}

/** Normalise a filter value that may be a single string, a comma-list, or an array into a clean string[]. */
function toList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : v.split(",");
  return arr.map((x) => x.trim()).filter(Boolean);
}

export async function browseProfiles(q: ProfileQuery): Promise<PagedResult<ProfileListItem>> {
  const page = q.page && q.page > 0 ? q.page : 1;
  const pageSize = q.pageSize && q.pageSize >= 1 && q.pageSize <= 100 ? q.pageSize : 24;

  const denoms = toList(q.denomination);
  const congs = toList(q.congregation);

  let where = sql`"IsDeleted" = false`;
  if (q.gender) where = sql`${where} AND "Gender" = ${q.gender}`;
  if (denoms.length) where = sql`${where} AND "Denomination" = ANY(${denoms})`;
  if (congs.length) where = sql`${where} AND "Congregation" = ANY(${congs})`;
  if (q.status) where = sql`${where} AND "Status" = ${q.status}`;
  if (q.live) where = sql`${where} AND ("Status" = 'Verified' OR "Status" = 'Active')`;

  const countRows = await sql`SELECT count(*)::int AS count FROM "TblProfiles" WHERE ${where}`;
  const total = Number(countRows[0].count);

  const rows = await sql`
    SELECT ${LIST_COLS} FROM "TblProfiles"
    WHERE ${where}
    ORDER BY "CreatedAt" DESC
    OFFSET ${(page - 1) * pageSize} LIMIT ${pageSize}`;

  return { items: rows.map((r) => toListItem(r as Row)), total, page, pageSize };
}

export async function getProfile(id: string): Promise<ProfileDetail | null> {
  const rows = await sql`SELECT ${DETAIL_COLS} FROM "TblProfiles" WHERE "Id" = ${id} AND "IsDeleted" = false LIMIT 1`;
  return rows.length ? toDetail(rows[0] as Row) : null;
}

export async function getStats(): Promise<ProfileStats> {
  const rows = await sql`SELECT "Status", count(*)::int AS c FROM "TblProfiles" WHERE "IsDeleted" = false GROUP BY "Status"`;
  const by: Record<string, number> = {};
  for (const r of rows) by[r.Status as string] = Number(r.c);
  const total = Object.values(by).reduce((a, b) => a + b, 0);
  return {
    total,
    pending: by["Pending"] ?? 0,
    verified: by["Verified"] ?? 0,
    active: by["Active"] ?? 0,
    suspended: by["Suspended"] ?? 0,
  };
}

export async function createProfile(dto: CreateProfileInput, ownerMemberId: string | null): Promise<ProfileDetail> {
  const countRows = await sql`SELECT count(*)::int AS c FROM "TblProfiles"`;
  const referenceId = `CSI${2000 + Number(countRows[0].c) + 1}`;
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO "TblProfiles"
      ("Id","ReferenceId","MembershipNo","OwnerMemberId","CreatedFor","LookingFor","Mobile","Email","FullName","Gender",
       "DateOfBirth","Height","MaritalStatus","MotherTongue","Denomination","HomeParish","Congregation","PresbyterName","PresbyterContact","AboutFaith","Expectations",
       "Education","Profession","City","FatherOccupation","MotherOccupation","MainPhotoUrl","Status","CreatedAt","IsDeleted")
    VALUES
      (${id}, ${referenceId}, ${dto.membershipNo ?? null}, ${ownerMemberId}, ${dto.createdFor ?? "Self"},
       ${dto.lookingFor ?? "Bride"}, ${dto.mobile ?? ""}, ${dto.email ?? null}, ${dto.fullName}, ${dto.gender},
       ${dto.dateOfBirth ?? null}, ${dto.height ?? null}, ${dto.maritalStatus ?? "Never married"},
       ${dto.motherTongue ?? "Tamil"}, ${dto.denomination ?? "CSI"}, ${dto.homeParish ?? ""},
       ${dto.congregation ?? "Dubai"}, ${dto.presbyterName ?? null}, ${dto.presbyterContact ?? null}, ${dto.aboutFaith ?? null}, ${dto.expectations ?? null}, ${dto.education ?? null},
       ${dto.profession ?? null}, ${dto.city ?? null}, ${dto.fatherOccupation ?? null},
       ${dto.motherOccupation ?? null}, ${dto.mainPhotoUrl ?? null}, 'Pending', now(), false)`;

  return (await getProfile(id))!;
}

export async function setProfileStatus(id: string, status: string, note?: string | null): Promise<boolean> {
  const clearsNote = !(status === "Rejected" || status === "Suspended");
  // Verifying (or re-verifying) restarts the 6-month re-verification clock.
  const verifying = status === "Verified";
  const rows = await sql`
    UPDATE "TblProfiles"
    SET "Status" = ${status},
        "StatusNote" = ${clearsNote ? null : (note ?? null)},
        "LastVerifiedAt" = ${verifying ? sql`now()` : sql`"LastVerifiedAt"`},
        "ReverifyNotifiedAt" = ${verifying ? sql`NULL` : sql`"ReverifyNotifiedAt"`},
        "UpdatedAt" = now()
    WHERE "Id" = ${id} AND "IsDeleted" = false
    RETURNING "Id"`;
  return rows.length > 0;
}

// ---------- 3-level listing verification ----------
// Roles are ranked; a level requires an approver of at least that rank.
//   L1 (initial check)  -> Office Staff / Moderator and above
//   L2 (presbyter review)-> Parish Presbyter and above
//   L3 (final approval)  -> Diocese Admin / Super Admin
const ROLE_RANK: Record<string, number> = {
  "Office Staff": 1,
  Moderator: 1,
  "Parish Presbyter": 2,
  "Diocese Admin": 3,
  "Super Admin": 3,
};
const LEVEL_MIN_RANK: Record<number, number> = { 1: 1, 2: 2, 3: 3 };
export const LEVEL_LABEL: Record<number, string> = { 1: "Initial check", 2: "Presbyter review", 3: "Final approval" };

/** Checklist the approver must confirm at each level before approving. */
export const APPROVAL_CHECKLIST: Record<number, string[]> = {
  1: [
    "Membership card matches the parish roster",
    "Name and contact details are complete",
    "Photo (if provided) is appropriate",
  ],
  2: [
    "Faith and denomination details are consistent",
    "No signs of a fake or duplicate profile",
    "Family / parish reference is satisfactory",
  ],
  3: [
    "Levels 1 and 2 have been reviewed",
    "Profile is accurate and complete",
    "Approved for public listing",
  ],
};

export interface ApprovalInfo {
  level: number;
  byName: string | null;
  byRole: string | null;
  createdAt: string;
}

export async function getProfileApprovals(profileIds: string[]): Promise<Record<string, ApprovalInfo[]>> {
  if (!profileIds.length) return {};
  const rows = await sql`
    SELECT "ProfileId","Level","ApprovedByName","ApprovedByRole","CreatedAt"
    FROM "TblProfileApprovals" WHERE "ProfileId" = ANY(${profileIds}) ORDER BY "Level" ASC`;
  const map: Record<string, ApprovalInfo[]> = {};
  for (const r of rows) {
    const pid = r.ProfileId as string;
    (map[pid] ??= []).push({
      level: Number(r.Level),
      byName: (r.ApprovedByName as string) ?? null,
      byRole: (r.ApprovedByRole as string) ?? null,
      createdAt: new Date(r.CreatedAt as string).toISOString(),
    });
  }
  return map;
}

export interface ApprovalLogEntry {
  id: string;
  referenceId: string;
  fullName: string;
  level: number;
  byName: string | null;
  byRole: string | null;
  checklist: string[];
  createdAt: string;
}

/** Audit log of every level approval - who verified which profile, when, and what they confirmed. */
export async function getApprovalLog(limit = 300): Promise<ApprovalLogEntry[]> {
  const rows = await sql`
    SELECT a."Id", a."Level", a."ApprovedByName", a."ApprovedByRole", a."Checklist", a."CreatedAt",
           p."ReferenceId", p."FullName"
    FROM "TblProfileApprovals" a
    LEFT JOIN "TblProfiles" p ON p."Id" = a."ProfileId"
    ORDER BY a."CreatedAt" DESC
    LIMIT ${limit}`;
  const parseList = (v: unknown): string[] => {
    try {
      const p = typeof v === "string" ? JSON.parse(v) : v;
      return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  return rows.map((r) => ({
    id: r.Id as string,
    referenceId: (r.ReferenceId as string) ?? "-",
    fullName: (r.FullName as string) ?? "(deleted profile)",
    level: Number(r.Level),
    byName: (r.ApprovedByName as string) ?? null,
    byRole: (r.ApprovedByRole as string) ?? null,
    checklist: parseList(r.Checklist),
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  }));
}

/** Approve one verification level for a profile. Levels must be done in order (1 -> 2 -> 3);
 *  level 3 marks the profile Verified. Regular staff need 3 different approvers; a Super Admin may do all. */
export async function approveProfileLevel(
  profileId: string,
  level: number,
  admin: { id: string; name: string; role: string },
  checklist?: string[]
): Promise<{ ok: boolean; status: number; message?: string }> {
  const required = (await getApprovalChecklist())[level] ?? [];
  const checked = checklist ?? [];
  if (!required.every((item) => checked.includes(item))) {
    return { ok: false, status: 400, message: "Please confirm all checklist items before approving this level." };
  }
  const rows = await sql`SELECT "ApprovalLevel","Status" FROM "TblProfiles" WHERE "Id" = ${profileId} AND "IsDeleted" = false LIMIT 1`;
  const p = rows[0];
  if (!p) return { ok: false, status: 404, message: "Profile not found." };
  if (p.Status !== "Pending") return { ok: false, status: 409, message: "This profile is not awaiting approval." };

  const current = Number(p.ApprovalLevel);
  if (level !== current + 1) return { ok: false, status: 409, message: `This profile needs Level ${current + 1} (${LEVEL_LABEL[current + 1]}) approval next.` };

  // Gate by explicit level assignment (set by a Super Admin) if any exist, else by role rank.
  const roleAllowed = (ROLE_RANK[admin.role] ?? 0) >= (LEVEL_MIN_RANK[level] ?? 99);
  if (!(await canApproveLevel(level, admin.id, admin.role, roleAllowed))) {
    return { ok: false, status: 403, message: `You are not assigned to approve Level ${level} (${LEVEL_LABEL[level]}).` };
  }

  // Each level needs a different approver - Super Admin is exempt so a small team is never blocked.
  if (admin.role !== "Super Admin") {
    const prior = await sql`SELECT 1 FROM "TblProfileApprovals" WHERE "ProfileId" = ${profileId} AND "ApprovedByUserId" = ${admin.id} LIMIT 1`;
    if (prior.length) return { ok: false, status: 409, message: "You already approved a level for this profile - each level needs a different approver." };
  }

  await sql`
    INSERT INTO "TblProfileApprovals" ("Id","ProfileId","Level","ApprovedByUserId","ApprovedByName","ApprovedByRole","Checklist","CreatedAt")
    VALUES (${crypto.randomUUID()}, ${profileId}, ${level}, ${admin.id}, ${admin.name}, ${admin.role}, ${JSON.stringify(checked)}, now())`;
  await sql`UPDATE "TblProfiles" SET "ApprovalLevel" = ${level}, "UpdatedAt" = now() WHERE "Id" = ${profileId}`;
  if (level === 3) await setProfileStatus(profileId, "Verified");

  return { ok: true, status: 200 };
}

export interface VerifyQueueItem extends ProfileListItem {
  approvalLevel: number;
  approvals: ApprovalInfo[];
}

/** Pending profiles awaiting the 3-level approval, with their progress. */
export async function getVerifyQueue(): Promise<VerifyQueueItem[]> {
  const rows = await sql`
    SELECT ${LIST_COLS}, "ApprovalLevel" FROM "TblProfiles"
    WHERE "IsDeleted" = false AND "Status" = 'Pending'
    ORDER BY "CreatedAt" ASC`;
  const ids = rows.map((r) => r.Id as string);
  const approvals = await getProfileApprovals(ids);
  return rows.map((r) => ({
    ...toListItem(r as Row),
    approvalLevel: Number(r.ApprovalLevel),
    approvals: approvals[r.Id as string] ?? [],
  }));
}

// ---------- profile reports ----------
export interface ReportRow {
  id: string;
  profileId: string;
  profileName: string;
  profileReferenceId: string;
  profileStatus: string | null;
  reporterName: string | null;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
}

export async function createReport(input: {
  profileId: string; reporterMemberId?: string | null; reporterName?: string | null; reason: string; details?: string | null;
}): Promise<boolean> {
  const exists = await sql`SELECT 1 FROM "TblProfiles" WHERE "Id" = ${input.profileId} AND "IsDeleted" = false LIMIT 1`;
  if (!exists.length) return false;
  await sql`
    INSERT INTO "TblReports" ("Id","ProfileId","ReporterMemberId","ReporterName","Reason","Details","Status","CreatedAt","IsDeleted")
    VALUES (${crypto.randomUUID()}, ${input.profileId}, ${input.reporterMemberId ?? null}, ${input.reporterName ?? null},
            ${input.reason}, ${input.details ?? null}, 'Open', now(), false)`;
  return true;
}

export async function listReports(): Promise<ReportRow[]> {
  const rows = await sql`
    SELECT r."Id", r."ProfileId", p."FullName", p."ReferenceId", p."Status" AS "ProfileStatus",
           r."ReporterName", r."Reason", r."Details", r."Status", r."CreatedAt"
    FROM "TblReports" r
    LEFT JOIN "TblProfiles" p ON p."Id" = r."ProfileId"
    WHERE r."IsDeleted" = false
    ORDER BY (r."Status" = 'Open') DESC, r."CreatedAt" DESC`;
  return rows.map((r) => ({
    id: r.Id as string,
    profileId: r.ProfileId as string,
    profileName: (r.FullName as string) ?? "(deleted profile)",
    profileReferenceId: (r.ReferenceId as string) ?? "-",
    profileStatus: (r.ProfileStatus as string) ?? null,
    reporterName: (r.ReporterName as string) ?? null,
    reason: r.Reason as string,
    details: (r.Details as string) ?? null,
    status: r.Status as string,
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  }));
}

/** Resolve a report: 'dismiss' closes it; 'suspend' suspends the reported profile and marks the report actioned. */
export async function resolveReport(id: string, action: "dismiss" | "suspend"): Promise<boolean> {
  const rows = await sql`SELECT "ProfileId" FROM "TblReports" WHERE "Id" = ${id} AND "IsDeleted" = false LIMIT 1`;
  if (!rows.length) return false;
  if (action === "suspend") {
    await setProfileStatus(rows[0].ProfileId as string, "Suspended", "Suspended following a member report.");
    await sql`UPDATE "TblReports" SET "Status" = 'ActionTaken' WHERE "Id" = ${id}`;
  } else {
    await sql`UPDATE "TblReports" SET "Status" = 'Dismissed' WHERE "Id" = ${id}`;
  }
  return true;
}

/** The owner of a profile updates (or removes) its photo. Only succeeds if the member owns it. */
export async function updateProfilePhoto(profileId: string, ownerMemberId: string, url: string | null): Promise<boolean> {
  const rows = await sql`
    UPDATE "TblProfiles" SET "MainPhotoUrl" = ${url}, "UpdatedAt" = now()
    WHERE "Id" = ${profileId} AND "OwnerMemberId" = ${ownerMemberId} AND "IsDeleted" = false
    RETURNING "Id"`;
  return rows.length > 0;
}

// ---------- periodic re-verification ----------
export interface ReverifyDue {
  id: string;
  referenceId: string;
  fullName: string;
  congregation: string;
  lastVerifiedAt: string;
}

/** Live profiles verified more than 6 months ago that have not been re-notified in the last 30 days. */
export async function findProfilesDueForReverify(): Promise<ReverifyDue[]> {
  const rows = await sql`
    SELECT "Id","ReferenceId","FullName","Congregation","LastVerifiedAt"
    FROM "TblProfiles"
    WHERE "IsDeleted" = false
      AND "Status" IN ('Verified','Active')
      AND "LastVerifiedAt" IS NOT NULL
      AND "LastVerifiedAt" < now() - interval '6 months'
      AND ("ReverifyNotifiedAt" IS NULL OR "ReverifyNotifiedAt" < now() - interval '30 days')
    ORDER BY "LastVerifiedAt" ASC`;
  return rows.map((r) => ({
    id: r.Id as string,
    referenceId: r.ReferenceId as string,
    fullName: r.FullName as string,
    congregation: (r.Congregation as string) ?? "",
    lastVerifiedAt: new Date(r.LastVerifiedAt as string).toISOString(),
  }));
}

export async function markReverifyNotified(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await sql`UPDATE "TblProfiles" SET "ReverifyNotifiedAt" = now() WHERE "Id" = ANY(${ids})`;
}

// ---------- members / membership validation ----------
export async function validateMembership(membershipNo: string): Promise<MemberValidation> {
  const card = (membershipNo ?? "").trim();
  if (!card) return { valid: false, memberId: null, name: null, congregation: null, message: "Please enter your membership card number." };

  // AGM roster first, then the sample members.
  const agm = await sql`SELECT "Id","Name","Congregation","IsActive" FROM "TblAGMMembers" WHERE "MembershipNo" = ${card} AND "IsDeleted" = false LIMIT 1`;
  const row = agm[0] ?? (await sql`SELECT "Id","Name","Congregation","IsActive" FROM "TblMembers" WHERE "MembershipNo" = ${card} AND "IsDeleted" = false LIMIT 1`)[0];

  if (!row) return { valid: false, memberId: null, name: null, congregation: null, message: "Membership number not found. Please contact the parish office." };
  if (!row.IsActive) return { valid: false, memberId: null, name: null, congregation: null, message: "This membership is inactive. Please contact the parish office." };

  return { valid: true, memberId: row.Id as string, name: row.Name as string, congregation: row.Congregation as string, message: null };
}

async function findMemberById(id: string): Promise<{ name: string; congregation: string } | null> {
  const m = (await sql`SELECT "Name","Congregation" FROM "TblMembers" WHERE "Id" = ${id} AND "IsDeleted" = false LIMIT 1`)[0]
    ?? (await sql`SELECT "Name","Congregation" FROM "TblAGMMembers" WHERE "Id" = ${id} AND "IsDeleted" = false LIMIT 1`)[0];
  return m ? { name: m.Name as string, congregation: m.Congregation as string } : null;
}

// ---------- shortlist ----------
export async function getShortlist(memberId: string): Promise<ProfileListItem[]> {
  const rows = await sql`
    SELECT p."Id", p."ReferenceId", p."FullName", p."Gender", p."DateOfBirth", p."Height",
           p."Denomination", p."Congregation", p."Education", p."Profession", p."City", p."MainPhotoUrl", p."Status"
    FROM "TblProfiles" p
    JOIN "TblShortlists" sl ON sl."ProfileId" = p."Id"
    WHERE sl."MemberId" = ${memberId} AND sl."IsDeleted" = false AND p."IsDeleted" = false
    ORDER BY sl."CreatedAt" DESC`;
  return rows.map((r) => toListItem(r as Row));
}

export async function addShortlist(memberId: string, profileId: string): Promise<void> {
  const exists = await sql`SELECT 1 FROM "TblShortlists" WHERE "MemberId" = ${memberId} AND "ProfileId" = ${profileId} AND "IsDeleted" = false LIMIT 1`;
  if (exists.length) return;
  await sql`INSERT INTO "TblShortlists" ("Id","MemberId","ProfileId","CreatedAt","IsDeleted") VALUES (${crypto.randomUUID()}, ${memberId}, ${profileId}, now(), false)`;
}

export async function removeShortlist(memberId: string, profileId: string): Promise<boolean> {
  const rows = await sql`DELETE FROM "TblShortlists" WHERE "MemberId" = ${memberId} AND "ProfileId" = ${profileId} RETURNING "Id"`;
  return rows.length > 0;
}

// ---------- contact requests ----------
function toContactRequest(r: Row): ContactRequest {
  return {
    id: r.Id as string,
    profileId: r.ProfileId as string,
    profileName: r.ProfileName as string,
    profileReferenceId: r.ProfileReferenceId as string,
    requesterMemberId: r.RequesterMemberId as string,
    requesterName: r.RequesterName as string,
    requesterCongregation: s(r.RequesterCongregation),
    status: r.Status as ContactRequest["status"],
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  };
}

export async function requestContact(profileId: string, requesterMemberId: string): Promise<ContactRequest> {
  const p = (await sql`SELECT "Id","FullName","ReferenceId","OwnerMemberId" FROM "TblProfiles" WHERE "Id" = ${profileId} AND "IsDeleted" = false LIMIT 1`)[0];
  if (!p) throw Object.assign(new Error("Profile not found."), { status: 404 });
  if (!p.OwnerMemberId) throw Object.assign(new Error("This profile is not yet linked to a member account, so contact cannot be requested."), { status: 400 });
  if (p.OwnerMemberId === requesterMemberId) throw Object.assign(new Error("This is your own profile."), { status: 400 });

  const existing = (await sql`SELECT * FROM "TblContactRequests" WHERE "RequesterMemberId" = ${requesterMemberId} AND "ProfileId" = ${profileId} AND "IsDeleted" = false LIMIT 1`)[0];
  if (existing) return toContactRequest(existing as Row);

  const requester = await findMemberById(requesterMemberId);
  if (!requester) throw Object.assign(new Error("Requesting member not found."), { status: 400 });

  const id = crypto.randomUUID();
  const inserted = await sql`
    INSERT INTO "TblContactRequests"
      ("Id","ProfileId","OwnerMemberId","RequesterMemberId","RequesterName","RequesterCongregation","ProfileName","ProfileReferenceId","Status","CreatedAt","IsDeleted")
    VALUES
      (${id}, ${profileId}, ${p.OwnerMemberId as string}, ${requesterMemberId}, ${requester.name}, ${requester.congregation}, ${p.FullName as string}, ${p.ReferenceId as string}, 'Pending', now(), false)
    RETURNING *`;
  return toContactRequest(inserted[0] as Row);
}

export async function getContactReveal(profileId: string, viewerMemberId: string): Promise<ContactReveal> {
  const p = (await sql`SELECT "Mobile","OwnerMemberId" FROM "TblProfiles" WHERE "Id" = ${profileId} AND "IsDeleted" = false LIMIT 1`)[0];
  if (!p) return { status: null, mobile: null, isOwner: false };
  if (p.OwnerMemberId && p.OwnerMemberId === viewerMemberId) {
    return { status: "Approved", mobile: (p.Mobile as string) ?? null, isOwner: true };
  }
  const req = (await sql`SELECT "Status" FROM "TblContactRequests" WHERE "RequesterMemberId" = ${viewerMemberId} AND "ProfileId" = ${profileId} AND "IsDeleted" = false LIMIT 1`)[0];
  if (!req) return { status: null, mobile: null, isOwner: false };
  const status = req.Status as ContactReveal["status"];
  return { status, mobile: status === "Approved" ? ((p.Mobile as string) ?? null) : null, isOwner: false };
}

export async function listIncomingContactRequests(ownerMemberId: string): Promise<ContactRequest[]> {
  const rows = await sql`SELECT * FROM "TblContactRequests" WHERE "OwnerMemberId" = ${ownerMemberId} AND "IsDeleted" = false ORDER BY "CreatedAt" DESC`;
  return rows.map((r) => toContactRequest(r as Row));
}

export async function listOutgoingContactRequests(requesterMemberId: string): Promise<ContactRequest[]> {
  const rows = await sql`SELECT * FROM "TblContactRequests" WHERE "RequesterMemberId" = ${requesterMemberId} AND "IsDeleted" = false ORDER BY "CreatedAt" DESC`;
  return rows.map((r) => toContactRequest(r as Row));
}

export async function setContactRequestStatus(id: string, ownerMemberId: string, status: string): Promise<boolean> {
  const rows = await sql`
    UPDATE "TblContactRequests" SET "Status" = ${status}, "UpdatedAt" = now()
    WHERE "Id" = ${id} AND "OwnerMemberId" = ${ownerMemberId} AND "IsDeleted" = false
    RETURNING "Id"`;
  return rows.length > 0;
}

// ---------- interests ----------
function toInterest(r: Row): Interest {
  return {
    id: r.Id as string,
    toProfileId: r.ToProfileId as string,
    toName: r.ToName as string,
    toReferenceId: r.ToReferenceId as string,
    fromName: r.FromName as string,
    fromMobile: r.FromMobile as string,
    message: s(r.Message),
    status: r.Status as Interest["status"],
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  };
}

export async function createInterest(dto: CreateInterestInput): Promise<Interest | null> {
  const p = (await sql`SELECT "Id","FullName","ReferenceId" FROM "TblProfiles" WHERE "Id" = ${dto.toProfileId} AND "IsDeleted" = false LIMIT 1`)[0];
  if (!p) return null;
  const inserted = await sql`
    INSERT INTO "TblInterests" ("Id","ToProfileId","ToName","ToReferenceId","FromName","FromMobile","Message","Status","CreatedAt","IsDeleted")
    VALUES (${crypto.randomUUID()}, ${p.Id as string}, ${p.FullName as string}, ${p.ReferenceId as string}, ${dto.fromName.trim()}, ${dto.fromMobile.trim()}, ${dto.message?.trim() || null}, 'Awaiting', now(), false)
    RETURNING *`;
  return toInterest(inserted[0] as Row);
}

export async function listInterests(): Promise<Interest[]> {
  const rows = await sql`SELECT * FROM "TblInterests" WHERE "IsDeleted" = false ORDER BY "CreatedAt" DESC`;
  return rows.map((r) => toInterest(r as Row));
}

export async function setInterestStatus(id: string, status: string): Promise<boolean> {
  const rows = await sql`UPDATE "TblInterests" SET "Status" = ${status}, "UpdatedAt" = now() WHERE "Id" = ${id} AND "IsDeleted" = false RETURNING "Id"`;
  return rows.length > 0;
}

// ---------- admin users ----------
function toAdminUser(r: Row): AdminUser {
  return {
    id: r.Id as string,
    name: r.Name as string,
    email: r.Email as string,
    role: r.Role as string,
    congregation: r.Congregation as string,
    status: r.Status as AdminUser["status"],
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const rows = await sql`SELECT * FROM "TblUsers" WHERE "IsDeleted" = false ORDER BY "CreatedAt" DESC`;
  return rows.map((r) => toAdminUser(r as Row));
}

export async function createAdminUser(dto: CreateUserInput): Promise<AdminUser | null> {
  const clash = await sql`SELECT 1 FROM "TblUsers" WHERE lower("Email") = lower(${dto.email}) AND "IsDeleted" = false LIMIT 1`;
  if (clash.length) return null; // conflict
  const inserted = await sql`
    INSERT INTO "TblUsers" ("Id","Name","Email","Role","Congregation","Status","CreatedAt","IsDeleted")
    VALUES (${crypto.randomUUID()}, ${dto.name}, ${dto.email}, ${dto.role}, ${dto.congregation}, 'Invited', now(), false)
    RETURNING *`;
  return toAdminUser(inserted[0] as Row);
}

export async function setAdminUserStatus(id: string, status: string): Promise<boolean> {
  const rows = await sql`UPDATE "TblUsers" SET "Status" = ${status}, "UpdatedAt" = now() WHERE "Id" = ${id} AND "IsDeleted" = false RETURNING "Id"`;
  return rows.length > 0;
}

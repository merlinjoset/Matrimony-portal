import "server-only";
import { sql } from "./db";
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
    maritalStatus: r.MaritalStatus as string,
    motherTongue: r.MotherTongue as string,
    homeParish: r.HomeParish as string,
    aboutFaith: s(r.AboutFaith),
    fatherOccupation: s(r.FatherOccupation),
    motherOccupation: s(r.MotherOccupation),
    statusNote: s(r.StatusNote),
    createdAt: new Date(r.CreatedAt as string).toISOString(),
  };
}

const LIST_COLS = sql`"Id","ReferenceId","FullName","Gender","DateOfBirth","Height","Denomination","Congregation","Education","Profession","City","MainPhotoUrl","Status"`;
const DETAIL_COLS = sql`"Id","ReferenceId","CreatedFor","LookingFor","FullName","Gender","DateOfBirth","Height","MaritalStatus","MotherTongue","Denomination","HomeParish","Congregation","AboutFaith","Education","Profession","City","FatherOccupation","MotherOccupation","MainPhotoUrl","Status","StatusNote","CreatedAt"`;

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
      ("Id","ReferenceId","MembershipNo","OwnerMemberId","CreatedFor","LookingFor","Mobile","FullName","Gender",
       "DateOfBirth","Height","MaritalStatus","MotherTongue","Denomination","HomeParish","Congregation","AboutFaith",
       "Education","Profession","City","FatherOccupation","MotherOccupation","MainPhotoUrl","Status","CreatedAt","IsDeleted")
    VALUES
      (${id}, ${referenceId}, ${dto.membershipNo ?? null}, ${ownerMemberId}, ${dto.createdFor ?? "Self"},
       ${dto.lookingFor ?? "Bride"}, ${dto.mobile ?? ""}, ${dto.fullName}, ${dto.gender},
       ${dto.dateOfBirth ?? null}, ${dto.height ?? null}, ${dto.maritalStatus ?? "Never married"},
       ${dto.motherTongue ?? "Tamil"}, ${dto.denomination ?? "CSI"}, ${dto.homeParish ?? ""},
       ${dto.congregation ?? "Dubai"}, ${dto.aboutFaith ?? null}, ${dto.education ?? null},
       ${dto.profession ?? null}, ${dto.city ?? null}, ${dto.fatherOccupation ?? null},
       ${dto.motherOccupation ?? null}, ${dto.mainPhotoUrl ?? null}, 'Pending', now(), false)`;

  return (await getProfile(id))!;
}

export async function setProfileStatus(id: string, status: string, note?: string | null): Promise<boolean> {
  const clearsNote = !(status === "Rejected" || status === "Suspended");
  const rows = await sql`
    UPDATE "TblProfiles"
    SET "Status" = ${status},
        "StatusNote" = ${clearsNote ? null : (note ?? null)},
        "UpdatedAt" = now()
    WHERE "Id" = ${id} AND "IsDeleted" = false
    RETURNING "Id"`;
  return rows.length > 0;
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

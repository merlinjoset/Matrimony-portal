// Mirrors the .NET API DTOs (CsiMatrimony.Application.Profiles)

export type Gender = "Female" | "Male";
export type ProfileStatus = "Pending" | "Verified" | "Active" | "Suspended" | "Rejected";

export interface ProfileListItem {
  id: string;
  referenceId: string;
  fullName: string;
  gender: Gender;
  age: number | null;
  height: string | null;
  denomination: string;
  congregation: string;
  education: string | null;
  profession: string | null;
  city: string | null;
  mainPhotoUrl: string | null;
  status: ProfileStatus;
}

export interface ProfileDetail extends ProfileListItem {
  createdFor: string;
  lookingFor: string;
  maritalStatus: string;
  motherTongue: string;
  homeParish: string;
  aboutFaith: string | null;
  fatherOccupation: string | null;
  motherOccupation: string | null;
  statusNote: string | null;
  createdAt: string;
}

/** Country dialing codes for the registration contact field. */
export const COUNTRY_CODES = [
  { code: "+971", label: "🇦🇪 +971 UAE" },
  { code: "+91", label: "🇮🇳 +91 India" },
  { code: "+966", label: "🇸🇦 +966 Saudi Arabia" },
  { code: "+974", label: "🇶🇦 +974 Qatar" },
  { code: "+973", label: "🇧🇭 +973 Bahrain" },
  { code: "+968", label: "🇴🇲 +968 Oman" },
  { code: "+965", label: "🇰🇼 +965 Kuwait" },
  { code: "+44", label: "🇬🇧 +44 UK" },
  { code: "+1", label: "🇺🇸 +1 USA / Canada" },
  { code: "+61", label: "🇦🇺 +61 Australia" },
  { code: "+65", label: "🇸🇬 +65 Singapore" },
  { code: "+60", label: "🇲🇾 +60 Malaysia" },
] as const;

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProfileStats {
  total: number;
  pending: number;
  verified: number;
  active: number;
  suspended: number;
}

export interface MemberValidation {
  valid: boolean;
  memberId: string | null;
  name: string | null;
  congregation: string | null;
  message: string | null;
}

/** Lightweight member session stored on the device after card sign-in. */
export interface MemberSession {
  memberId: string;
  name: string;
  membershipNo: string;
}

export interface CreateProfileInput {
  membershipNo: string;
  createdFor: string;
  lookingFor: string;
  mobile: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string | null; // yyyy-MM-dd
  height?: string | null;
  maritalStatus: string;
  motherTongue: string;
  denomination: string;
  homeParish: string;
  congregation: string;
  aboutFaith?: string | null;
  education?: string | null;
  profession?: string | null;
  city?: string | null;
  fatherOccupation?: string | null;
  motherOccupation?: string | null;
  mainPhotoUrl?: string | null;
}

export const CONGREGATIONS = ["Dubai", "Fujairah", "Ras Al Khaimah", "India", "Other"] as const;
export const DENOMINATIONS = ["CSI", "Pentecostal", "Lutheran", "Roman Catholic", "Other Christian"] as const;

// ---- Admin users ----
export type AdminUserStatus = "Invited" | "Active" | "Disabled";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  congregation: string;
  status: AdminUserStatus;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: string;
  congregation: string;
}

export const ADMIN_ROLES = [
  "Diocese Admin",
  "Parish Presbyter",
  "Moderator",
  "Office Staff",
] as const;

export const ADMIN_CONGREGATIONS = [
  "Dubai (Main)",
  "Fujairah",
  "Ras Al Khaimah",
] as const;

// ---- Interests ----
export type InterestStatus = "Awaiting" | "Accepted" | "Declined";

export interface Interest {
  id: string;
  toProfileId: string;
  toName: string;
  toReferenceId: string;
  fromName: string;
  fromMobile: string;
  message: string | null;
  status: InterestStatus;
  createdAt: string;
}

export interface CreateInterestInput {
  toProfileId: string;
  fromName: string;
  fromMobile: string;
  message?: string | null;
}

// ---- Contact-reveal requests ----
export type ContactRequestStatus = "Pending" | "Approved" | "Declined";

export interface ContactRequest {
  id: string;
  profileId: string;
  profileName: string;
  profileReferenceId: string;
  requesterMemberId: string;
  requesterName: string;
  requesterCongregation: string | null;
  status: ContactRequestStatus;
  createdAt: string;
}

/** What the signed-in viewer may see of a profile's contact number. */
export interface ContactReveal {
  status: ContactRequestStatus | null; // null = not requested yet
  mobile: string | null; // set only when owner or approved
  isOwner: boolean;
}

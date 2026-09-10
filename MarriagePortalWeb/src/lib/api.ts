import type {
  AdminUser,
  ApprovalLogEntry,
  ContactRequest,
  ContactRequestStatus,
  ContactReveal,
  CurrentAdmin,
  VerifyQueueItem,
  MemberAccount,
  MemberSession,
  CreateInterestInput,
  CreateProfileInput,
  CreateUserInput,
  Interest,
  InterestStatus,
  LoginLog,
  MemberValidation,
  Report,
  PagedResult,
  ProfileDetail,
  ProfileListItem,
  ProfileStats,
  ProfileStatus,
} from "./types";

// The API now lives inside this same Next.js app under /api (same origin).
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export interface EmailSettingsDto {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  from: string;
  notifyEmail: string;
  appBaseUrl: string;
  hasPassword: boolean;
}

export interface EmailSettingsInput {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass?: string;
  from: string;
  notifyEmail: string;
  appBaseUrl: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  // Only safe (idempotent) reads are retried, so we never double-submit a write.
  const maxAttempts = method === "GET" ? 4 : 1;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
        cache: "no-store",
      });

      // A sleeping (cold-starting) host returns a gateway error; wait and retry.
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxAttempts) {
        await sleep(attempt * 4000);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new ApiError(res.status, body || res.statusText);
      }
      // Read as text so empty bodies (204, or 201 with no content) don't blow up JSON.parse.
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } catch (e) {
      // A real API error (4xx/5xx we surfaced) should not be retried.
      if (e instanceof ApiError) throw e;
      // Network failure (e.g. connection refused while the host wakes) — retry.
      lastError = e;
      if (attempt < maxAttempts) {
        await sleep(attempt * 4000);
        continue;
      }
    }
  }
  throw lastError;
}

export interface BrowseParams {
  gender?: string;
  denomination?: string;
  congregation?: string;
  status?: string;
  live?: boolean;
  page?: number;
  pageSize?: number;
}

export const api = {
  browseProfiles(params: BrowseParams = {}): Promise<PagedResult<ProfileListItem>> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
    });
    const qs = q.toString();
    return http<PagedResult<ProfileListItem>>(`/profiles${qs ? `?${qs}` : ""}`);
  },

  getProfile(id: string): Promise<ProfileDetail> {
    return http<ProfileDetail>(`/profiles/${id}`);
  },

  createProfile(input: CreateProfileInput): Promise<ProfileDetail> {
    return http<ProfileDetail>(`/profiles`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  validateMembership(membershipNo: string): Promise<MemberValidation> {
    return http<MemberValidation>(`/members/validate?membershipNo=${encodeURIComponent(membershipNo)}`);
  },

  getShortlist(memberId: string): Promise<ProfileListItem[]> {
    return http<ProfileListItem[]>(`/members/${memberId}/shortlist`);
  },

  hasProfile(memberId: string): Promise<{ hasProfile: boolean }> {
    return http<{ hasProfile: boolean }>(`/members/${memberId}/has-profile`);
  },

  getMemberSelf(memberId: string): Promise<{ name: string | null; mobile: string | null }> {
    return http<{ name: string | null; mobile: string | null }>(`/members/${memberId}/self`);
  },

  addShortlist(memberId: string, profileId: string): Promise<void> {
    return http<void>(`/members/${memberId}/shortlist`, {
      method: "POST",
      body: JSON.stringify({ profileId }),
    });
  },

  removeShortlist(memberId: string, profileId: string): Promise<void> {
    return http<void>(`/members/${memberId}/shortlist/${profileId}`, { method: "DELETE" });
  },

  getStats(): Promise<ProfileStats> {
    return http<ProfileStats>(`/profiles/stats`);
  },

  setStatus(id: string, status: ProfileStatus, note?: string): Promise<void> {
    return http<void>(`/profiles/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    });
  },

  getUsers(): Promise<AdminUser[]> {
    return http<AdminUser[]>(`/admin/users`);
  },

  createUser(input: CreateUserInput): Promise<AdminUser> {
    return http<AdminUser>(`/admin/users`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  setUserStatus(id: string, status: string): Promise<void> {
    return http<void>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  setUserPassword(id: string, password: string): Promise<void> {
    return http<void>(`/admin/users/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    });
  },

  createInterest(input: CreateInterestInput): Promise<Interest> {
    return http<Interest>(`/interests`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getInterests(): Promise<Interest[]> {
    return http<Interest[]>(`/interests`);
  },

  setInterestStatus(id: string, status: InterestStatus): Promise<void> {
    return http<void>(`/interests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // ---- Auth (username + password) ----
  signup(membershipNo: string, username: string, password: string): Promise<{ message: string }> {
    return http<{ message: string }>(`/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ membershipNo, username, password }),
    });
  },

  // ---- non-member email OTP ----
  sendEmailOtp(email: string): Promise<{ message: string }> {
    return http<{ message: string }>(`/otp/send`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyEmailOtp(email: string, code: string): Promise<{ message: string; token: string }> {
    return http<{ message: string; token: string }>(`/otp/verify`, {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  signupGuest(email: string, emailToken: string, username: string, password: string, name: string): Promise<{ message: string }> {
    return http<{ message: string }>(`/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ email, emailToken, username, password, name }),
    });
  },

  resetPassword(email: string, emailToken: string, newPassword: string, scope: "admin" | "member"): Promise<{ message: string }> {
    return http<{ message: string }>(`/auth/reset-password`, {
      method: "POST",
      body: JSON.stringify({ email, emailToken, newPassword, scope }),
    });
  },

  login(username: string, password: string): Promise<MemberSession> {
    return http<MemberSession>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  getMemberAccounts(): Promise<MemberAccount[]> {
    return http<MemberAccount[]>(`/admin/accounts`);
  },

  getLoginLogs(): Promise<LoginLog[]> {
    return http<LoginLog[]>(`/admin/logins`);
  },

  updateProfilePhoto(profileId: string, memberId: string, mainPhotoUrl: string | null): Promise<void> {
    return http<void>(`/profiles/${profileId}/photo`, {
      method: "PATCH",
      body: JSON.stringify({ memberId, mainPhotoUrl }),
    });
  },

  reportProfile(profileId: string, input: { reason: string; details?: string; reporterMemberId?: string; reporterName?: string }): Promise<void> {
    return http<void>(`/profiles/${profileId}/report`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getReports(): Promise<Report[]> {
    return http<Report[]>(`/admin/reports`);
  },

  getMe(): Promise<CurrentAdmin> {
    return http<CurrentAdmin>(`/admin/me`);
  },

  getVerifyQueue(): Promise<VerifyQueueItem[]> {
    return http<VerifyQueueItem[]>(`/admin/verify-queue`);
  },

  getChecklist(): Promise<Record<number, string[]>> {
    return http<Record<number, string[]>>(`/admin/checklist`);
  },

  getApprovers(): Promise<Record<number, string[]>> {
    return http<Record<number, string[]>>(`/admin/approvers`);
  },

  saveApprovers(config: Record<number, string[]>): Promise<void> {
    return http<void>(`/admin/approvers`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
  },

  getApprovalLog(): Promise<ApprovalLogEntry[]> {
    return http<ApprovalLogEntry[]>(`/admin/approval-log`);
  },

  saveChecklist(config: Record<number, string[]>): Promise<void> {
    return http<void>(`/admin/checklist`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
  },

  approveProfileLevel(id: string, level: number, checklist: string[]): Promise<void> {
    return http<void>(`/admin/profiles/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ level, checklist }),
    });
  },

  resolveReport(id: string, action: "dismiss" | "suspend"): Promise<void> {
    return http<void>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
  },

  createMemberAccount(input: { membershipNo: string; username: string; password: string; email?: string }): Promise<void> {
    return http<void>(`/admin/accounts`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  setMemberAccountStatus(id: string, status: string): Promise<void> {
    return http<void>(`/admin/accounts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  setMemberAccountPassword(id: string, password: string): Promise<void> {
    return http<void>(`/admin/accounts/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    });
  },

  resetMemberDevice(id: string): Promise<void> {
    return http<void>(`/admin/accounts/${id}/reset-device`, { method: "POST" });
  },

  // ---- Email settings ----
  getEmailSettings(): Promise<EmailSettingsDto> {
    return http<EmailSettingsDto>(`/admin/settings/email`);
  },

  saveEmailSettings(input: EmailSettingsInput): Promise<void> {
    return http<void>(`/admin/settings/email`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  sendTestEmail(to: string): Promise<void> {
    return http<void>(`/admin/settings/email/test`, {
      method: "POST",
      body: JSON.stringify({ to }),
    });
  },

  // ---- Contact-reveal requests ----
  getContact(profileId: string, viewerMemberId: string): Promise<ContactReveal> {
    return http<ContactReveal>(`/profiles/${profileId}/contact?viewerMemberId=${encodeURIComponent(viewerMemberId)}`);
  },

  requestContact(profileId: string, requesterMemberId: string): Promise<ContactRequest> {
    return http<ContactRequest>(`/profiles/${profileId}/contact-requests`, {
      method: "POST",
      body: JSON.stringify({ requesterMemberId }),
    });
  },

  getIncomingContactRequests(memberId: string): Promise<ContactRequest[]> {
    return http<ContactRequest[]>(`/members/${memberId}/contact-requests/incoming`);
  },

  getOutgoingContactRequests(memberId: string): Promise<ContactRequest[]> {
    return http<ContactRequest[]>(`/members/${memberId}/contact-requests/outgoing`);
  },

  setContactRequestStatus(id: string, memberId: string, status: ContactRequestStatus): Promise<void> {
    return http<void>(`/contact-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ memberId, status }),
    });
  },

  async uploadPhoto(file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append("file", file);
    // No Content-Type header - the browser sets the multipart boundary itself.
    const res = await fetch(`${BASE}/uploads/photo`, { method: "POST", body: fd });
    if (!res.ok) throw new ApiError(res.status, (await res.text().catch(() => "")) || res.statusText);
    return (await res.json()) as { url: string };
  },
};

export { ApiError };

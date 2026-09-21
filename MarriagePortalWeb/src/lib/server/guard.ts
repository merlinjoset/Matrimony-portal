import "server-only";
import { getAdminSession } from "./admin-session";
import { getMemberSession } from "./member-session";
import { getAdminUserById, anyAdminHasPassword } from "./auth";
import { getMemberSessionInfo } from "./queries";

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
}

const BOOTSTRAP_ADMIN: AdminIdentity = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Admin",
  email: "",
  role: "Super Admin",
};

/**
 * Gate an admin API route. Returns the signed-in staff identity, or a 401 Response to return.
 *
 * Usage:
 *   const g = await requireAdmin();
 *   if (!g.ok) return g.response;
 *   // g.admin is the AdminIdentity
 *
 * Bootstrap: before any staff password has been set, the panel is intentionally open so the
 * first admin can be created - in that state we allow the request as a Super Admin. Once any
 * password exists, a valid signed session cookie is required.
 */
export async function requireAdmin(): Promise<{ ok: true; admin: AdminIdentity } | { ok: false; response: Response }> {
  const id = await getAdminSession();
  if (id) {
    const user = await getAdminUserById(id);
    if (user) return { ok: true, admin: user };
  }
  if (!(await anyAdminHasPassword())) {
    return { ok: true, admin: BOOTSTRAP_ADMIN };
  }
  return {
    ok: false,
    response: new Response(JSON.stringify({ message: "Please sign in to the admin panel." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  };
}

/**
 * Gate a member API route. Returns the authenticated memberId (from the signed session cookie),
 * or a 401 Response to return. The memberId is taken from the cookie, never from the URL or
 * request body, so a caller cannot act as another member by supplying someone else's memberId.
 * The member account must still exist and be Active, so a disabled account loses access at once.
 *
 * Usage:
 *   const g = await requireMember();
 *   if (!g.ok) return g.response;
 *   // g.memberId is the caller's own member id
 */
export async function requireMember(): Promise<{ ok: true; memberId: string } | { ok: false; response: Response }> {
  const memberId = await getMemberSession();
  if (memberId) {
    const info = await getMemberSessionInfo(memberId);
    if (info) return { ok: true, memberId };
  }
  return {
    ok: false,
    response: new Response(JSON.stringify({ message: "Please sign in to continue." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  };
}

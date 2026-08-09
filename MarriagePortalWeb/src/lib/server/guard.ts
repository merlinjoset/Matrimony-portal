import "server-only";
import { getAdminSession } from "./admin-session";
import { getAdminUserById, anyAdminHasPassword } from "./auth";

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

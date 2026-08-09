import { getAdminSession } from "@/lib/server/admin-session";
import { getAdminUserById } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const id = await getAdminSession();
  const user = id ? await getAdminUserById(id) : null;
  // In bootstrap mode (no password set yet) there is no session; report a Super Admin so the panel stays usable.
  return Response.json(user ?? { id: "bootstrap", name: "Admin", email: "", role: "Super Admin" });
}

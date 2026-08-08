import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminLogin } from "@/components/admin/admin-login";
import { getAdminSession } from "@/lib/server/admin-session";
import { anyAdminHasPassword, getAdminUserById } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Admin · CSI Holy Matrimony",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userId = await getAdminSession();
  const current = userId ? await getAdminUserById(userId) : null;

  // Bootstrap: until at least one staff user has a password set, the panel stays open
  // so the first admin can create a login. Once secured, require sign-in.
  if (!current) {
    const secured = await anyAdminHasPassword();
    if (secured) return <AdminLogin />;
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar user={current} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}

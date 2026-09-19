"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Heart,
  Church,
  UserCog,
  KeyRound,
  Flag,
  Settings,
  ExternalLink,
  LogOut,
  ScrollText,
  ListChecks,
  UserCheck,
  History,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUserInfo {
  name: string;
  role: string;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "AD";
}

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/verify", label: "Verification Queue", icon: ShieldCheck },
  { href: "/admin/checklists", label: "Approval Checklist", icon: ListChecks },
  { href: "/admin/approvers", label: "Approvers by Level", icon: UserCheck },
  { href: "/admin/approval-log", label: "Approval Log", icon: History },
  { href: "/admin/members", label: "Profiles", icon: Users },
  { href: "/admin/accounts", label: "Member Accounts", icon: KeyRound },
  { href: "/admin/logins", label: "Login Activity", icon: ScrollText },
  { href: "/admin/interests", label: "Interests", icon: Heart },
  { href: "/admin/parishes", label: "Parishes", icon: Church },
  { href: "/admin/users", label: "Users & Roles", icon: UserCog },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ user }: { user?: AdminUserInfo | null }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar with the menu button (hidden on desktop). */}
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-gradient-to-r from-maroon to-maroon-2 px-4 py-3 text-white lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-lg hover:bg-white/10">
          <Menu className="size-6" />
        </button>
        <Image src="/emblem.jpg" alt="CSI" width={30} height={30} className="rounded-full bg-white p-[2px]" />
        <span className="text-sm font-bold">Admin Portal</span>
      </header>

      {/* Backdrop on mobile when the drawer is open. */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-gradient-to-b from-maroon to-maroon-2 text-white transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:w-60 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-white/15 px-4 py-4">
          <Image src="/emblem.jpg" alt="CSI" width={38} height={38} className="rounded-full bg-white p-[2px]" />
          <div className="leading-tight">
            <div className="text-sm font-bold">CSI Holy Matrimony</div>
            <div className="text-[10.5px] opacity-80">Admin Portal</div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="ml-auto grid size-8 place-items-center rounded-lg hover:bg-white/10 lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
          {items.map((it) => {
            const active = it.exact ? path === it.href : path.startsWith(it.href);
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  active ? "bg-white/18 opacity-100" : "opacity-85 hover:bg-white/10 hover:opacity-100"
                )}
              >
                <Icon className="size-[18px]" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/15 p-3 text-sm">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-full bg-gold text-[13px] font-bold text-maroon">{initials(user?.name ?? "Admin")}</div>
            <div>
              <div className="font-semibold text-white">{user?.name ?? "Admin"}</div>
              <div className="text-[11px] opacity-80">{user?.role ?? "Staff"}</div>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-[12.5px] text-[#f1e7d8] hover:underline">
            <ExternalLink className="size-3.5" /> View public site
          </Link>
          {user && (
            <button onClick={logout} className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#f1e7d8] hover:underline">
              <LogOut className="size-3.5" /> Sign out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

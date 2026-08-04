"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Heart,
  Church,
  UserCog,
  Flag,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/verify", label: "Verification Queue", icon: ShieldCheck },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/interests", label: "Interests", icon: Heart },
  { href: "/admin/parishes", label: "Parishes", icon: Church },
  { href: "/admin/users", label: "Users & Roles", icon: UserCog },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col bg-gradient-to-b from-maroon to-maroon-2 text-white">
      <div className="flex items-center gap-2.5 border-b border-white/15 px-4 py-4">
        <Image src="/emblem.jpg" alt="CSI" width={38} height={38} className="rounded-full bg-white p-[2px]" />
        <div className="leading-tight">
          <div className="text-sm font-bold">CSI Holy Matrimony</div>
          <div className="text-[10.5px] opacity-80">Admin Portal</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {items.map((it) => {
          const active = it.exact ? path === it.href : path.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
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
          <div className="grid size-8 place-items-center rounded-full bg-gold text-[13px] font-bold text-maroon">RB</div>
          <div>
            <div className="font-semibold text-white">Rev. Benjamin</div>
            <div className="text-[11px] opacity-80">Diocese Admin</div>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-[12.5px] text-[#f1e7d8] hover:underline">
          <ExternalLink className="size-3.5" /> View public site
        </Link>
      </div>
    </aside>
  );
}

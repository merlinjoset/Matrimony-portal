"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const { member } = useMemberShortlist();
  const nav = [
    { href: "/", label: t("nav_home") },
    { href: "/browse", label: t("nav_browse") },
    { href: "/how-it-works", label: t("nav_how") },
    { href: "/shortlist", label: t("nav_shortlist") },
    ...(member ? [{ href: "/requests", label: t("nav_requests") }] : []),
    ...(member ? [] : [{ href: "/register", label: t("nav_register") }]),
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="grid size-9 place-items-center rounded-lg text-white hover:bg-white/10 xl:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-maroon">{t("brand")}</SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-col px-4">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

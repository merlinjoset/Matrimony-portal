"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Heart, Inbox } from "lucide-react";
import { useMemberShortlist } from "@/lib/member-shortlist";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TITLES = new Set(["mr", "mrs", "miss", "ms", "dr", "rev", "sis", "br"]);

function initials(name: string) {
  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !TITLES.has(w.replace(/\./g, "").toLowerCase()));
  const source = words.length ? words : name.split(/\s+/).filter(Boolean);
  return source.map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/** Signed-in member account control: avatar + name button that opens a dropdown. */
export function MemberMenu() {
  const { member, signOut } = useMemberShortlist();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!member) return null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gold text-[12.5px] font-bold text-maroon">
          {initials(member.name)}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-black/10 bg-white text-foreground shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{member.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("l_membership_short")}: {member.membershipNo}</p>
          </div>
          <div className="py-1">
            <Link
              href="/shortlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted"
              role="menuitem"
            >
              <Heart className="size-4 text-maroon" /> {t("nav_shortlist")}
            </Link>
            <Link
              href="/requests"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted"
              role="menuitem"
            >
              <Inbox className="size-4 text-maroon" /> {t("nav_requests")}
            </Link>
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2 text-left text-sm font-medium text-destructive hover:bg-muted"
              role="menuitem"
            >
              <LogOut className="size-4" /> {t("signout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

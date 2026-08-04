"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { MemberMenu } from "@/components/member-menu";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t, lang, setLang } = useT();
  const { count, member, openSignIn } = useMemberShortlist();

  const nav = [
    { href: "/", label: t("nav_home") },
    { href: "/browse", label: t("nav_browse") },
    { href: "/how-it-works", label: t("nav_how") },
    { href: "/shortlist", label: t("nav_shortlist"), badge: count },
    // Contact-request approvals are only meaningful once signed in.
    ...(member ? [{ href: "/requests", label: t("nav_requests") }] : []),
    // Register is only for people who are not yet signed-in members.
    ...(member ? [] : [{ href: "/register", label: t("nav_register") }]),
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-maroon to-maroon-2 text-white shadow-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-3 px-5">
        <MobileNav />
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/emblem.jpg"
            alt="Church of South India"
            width={44}
            height={44}
            className="shrink-0 rounded-full bg-white p-[3px] shadow"
            priority
          />
          <span className="leading-tight">
            <span className="block whitespace-nowrap text-[19px] font-bold tracking-wide">{t("brand")}</span>
            <span className="block whitespace-nowrap text-[11px] opacity-85">{t("brand_sub")}</span>
          </span>
        </Link>

        <nav className="ml-5 hidden items-center gap-0.5 xl:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold opacity-90 transition hover:bg-white/10 hover:opacity-100"
            >
              {n.label}
              {n.badge ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-maroon">
                  {n.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* Right-side controls */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Language toggle */}
          <div className="flex items-center gap-0.5 rounded-full bg-black/20 p-0.5">
            {(["en", "ta"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold transition",
                  lang === l ? "bg-gold text-maroon" : "text-white/70 hover:text-white"
                )}
              >
                {l === "en" ? "EN" : "தமிழ்"}
              </button>
            ))}
          </div>

          {/* Member account dropdown, or sign in */}
          {member ? (
            <MemberMenu />
          ) : (
            <button
              onClick={openSignIn}
              className="hidden whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold opacity-90 hover:bg-white/10 hover:opacity-100 sm:block"
            >
              {t("nav_signin")}
            </button>
          )}

          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            className="hidden whitespace-nowrap bg-gold text-maroon hover:bg-gold! hover:brightness-105 sm:inline-flex"
          >
            {t("create_profile")}
          </Button>
        </div>
      </div>
    </header>
  );
}

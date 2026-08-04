"use client";

import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-12 bg-[#2c2522] text-[#c9beb2]">
      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-10 px-6 py-12 md:grid-cols-[2fr_1fr_1.2fr]">
        {/* Brand */}
        <div className="space-y-2.5">
          <h5 className="text-[15px] font-semibold text-white">✝ {t("brand")}</h5>
          <p className="text-sm text-[#d8cabb]" style={{ fontFamily: "var(--font-tamil), sans-serif" }}>
            CSI தமிழ் திருச்சபை மணமக்கள் சேவை
          </p>
          <p className="max-w-md text-sm leading-relaxed">{t("foot_about")}</p>
          <p className="max-w-md text-sm leading-relaxed text-[#d8cabb]">{t("foot_heritage")}</p>
        </div>

        {/* Explore */}
        <div>
          <h5 className="mb-3.5 text-[15px] font-semibold text-white">{t("foot_explore")}</h5>
          <nav className="space-y-2.5 text-sm">
            <a href="/browse" className="block w-fit transition hover:text-white">{t("nav_browse")}</a>
            <a href="/register" className="block w-fit transition hover:text-white">{t("nav_register")}</a>
            <a href="/how-it-works" className="block w-fit transition hover:text-white">{t("nav_how")}</a>
          </nav>
        </div>

        {/* Parish office */}
        <div>
          <h5 className="mb-3.5 text-[15px] font-semibold text-white">{t("foot_office")}</h5>
          <div className="space-y-2.5 text-sm">
            <p className="leading-relaxed">St Paul&apos;s Hall, Holy Trinity Church Compound, Oud Metha, Dubai, UAE</p>
            <a href="mailto:office@csitamilparishdubai.com" className="block w-fit transition hover:text-white">
              office@csitamilparishdubai.com
            </a>
            <a href="tel:+971501386756" className="block w-fit transition hover:text-white">+971 50 138 6756</a>
            <a
              href="https://whatsapp.com/channel/0029VbAvMM69RZAWuUmChl03"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 transition hover:text-white"
            >
              💬 WhatsApp Channel
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[#463d37] py-5 text-center text-xs text-[#9a8f84]">
        <div>{t("foot_copy")}</div>
        <div className="mt-1.5">
          {t("powered_by")}{" "}
          <a
            href="http://merlinjose.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#c9a24b] hover:underline"
          >
            Merlin Jose
          </a>
        </div>
      </div>
    </footer>
  );
}

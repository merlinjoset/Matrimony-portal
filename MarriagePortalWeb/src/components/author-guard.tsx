"use client";

import { useEffect } from "react";

/**
 * Keeps the "Developed by Merlin Jose" author credit present. If the credit is removed from the
 * page (at runtime or from the source), this re-inserts it and shows a short "not authorized"
 * notice. Note: this is a deterrent, not an unbreakable lock - client code can always be edited.
 */
const MARK = "data-author-credit";
const NAME = "Merlin Jose";
const HREF = "http://merlinjose.tech";

export function AuthorGuard() {
  useEffect(() => {
    function makeBadge(): HTMLElement {
      const el = document.createElement("div");
      el.setAttribute(MARK, "merlin-jose");
      el.style.cssText =
        "position:fixed;bottom:6px;right:10px;z-index:2147483000;font:600 11px system-ui,-apple-system,sans-serif;color:#9a8f84;opacity:.8";
      const a = document.createElement("a");
      a.href = HREF;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = NAME;
      a.style.cssText = "color:#c9a24b;text-decoration:none";
      el.append("Developed by ", a);
      return el;
    }

    function present(): boolean {
      const el = document.querySelector(`[${MARK}]`);
      return !!(el && el.textContent && el.textContent.includes(NAME));
    }

    let banner: HTMLElement | null = null;
    function warn() {
      if (banner) return;
      banner = document.createElement("div");
      banner.setAttribute(MARK, "warning");
      banner.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:2147483001;background:#8a2a38;color:#fff;font:600 13px system-ui,-apple-system,sans-serif;text-align:center;padding:10px 14px;box-shadow:0 2px 8px rgba(0,0,0,.25)";
      banner.textContent = "You are not authorized to remove the ‘Developed by Merlin Jose’ credit.";
      document.body.appendChild(banner);
      window.setTimeout(() => {
        banner?.remove();
        banner = null;
      }, 5000);
    }

    let first = true;
    function ensure() {
      if (!present()) {
        if (!first) warn(); // only warn on removal, not on the initial silent insert
        document.body.appendChild(makeBadge());
      }
      first = false;
    }

    ensure();
    const obs = new MutationObserver(ensure);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    const iv = window.setInterval(ensure, 1500);
    return () => {
      obs.disconnect();
      window.clearInterval(iv);
    };
  }, []);

  return null;
}

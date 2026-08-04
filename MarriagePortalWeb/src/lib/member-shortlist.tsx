"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { MemberSession, ProfileListItem } from "@/lib/types";

const KEY = "csi_member";

interface Ctx {
  member: MemberSession | null;
  ready: boolean;
  items: ProfileListItem[];
  count: number;
  has: (profileId: string) => boolean;
  toggle: (item: ProfileListItem) => void;
  remove: (profileId: string) => void;
  signOut: () => void;
  openSignIn: () => void;
}

const ShortlistContext = createContext<Ctx | null>(null);

export function MemberShortlistProvider({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [member, setMember] = useState<MemberSession | null>(null);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ProfileListItem[]>([]);

  const [open, setOpen] = useState(false);
  const [card, setCard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ProfileListItem | null>(null);

  // restore session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setMember(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  // load shortlist whenever the member changes
  const loadList = useCallback((m: MemberSession | null) => {
    if (!m) { setItems([]); return; }
    api.getShortlist(m.memberId).then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(() => { loadList(member); }, [member, loadList]);

  const has = useCallback((id: string) => items.some((x) => x.id === id), [items]);

  const persistMember = (m: MemberSession | null) => {
    setMember(m);
    if (m) localStorage.setItem(KEY, JSON.stringify(m));
    else localStorage.removeItem(KEY);
  };

  const add = useCallback(async (m: MemberSession, item: ProfileListItem) => {
    setItems((xs) => (xs.some((x) => x.id === item.id) ? xs : [item, ...xs]));
    try { await api.addShortlist(m.memberId, item.id); } catch { loadList(m); }
  }, [loadList]);

  const remove = useCallback((id: string) => {
    if (!member) return;
    setItems((xs) => xs.filter((x) => x.id !== id));
    api.removeShortlist(member.memberId, id).catch(() => loadList(member));
  }, [member, loadList]);

  const toggle = useCallback((item: ProfileListItem) => {
    if (!member) { setPending(item); setError(null); setOpen(true); return; }
    if (has(item.id)) { remove(item.id); toast.success(t("sl_removed")); }
    else { add(member, item); toast.success(t("sl_added")); }
  }, [member, has, remove, add, t]);

  async function signIn() {
    const c = card.trim();
    if (!c) return;
    setBusy(true); setError(null);
    try {
      const res = await api.validateMembership(c);
      if (!res.valid || !res.memberId) { setError(res.message ?? "Invalid card."); return; }
      const m: MemberSession = { memberId: res.memberId, name: res.name ?? "Member", membershipNo: c };
      persistMember(m);
      toast.success(`${t("toast_signed_in")} - ${m.name}`);
      setOpen(false); setCard("");
      // fetch list, then add any pending profile
      const list = await api.getShortlist(m.memberId).catch(() => [] as ProfileListItem[]);
      setItems(list);
      if (pending) { add(m, pending); toast.success(t("sl_added")); setPending(null); }
    } catch {
      setError(t("ei_err"));
    } finally {
      setBusy(false);
    }
  }

  const signOut = () => { persistMember(null); setItems([]); toast.success(t("toast_signed_out")); };

  return (
    <ShortlistContext.Provider
      value={{ member, ready, items, count: items.length, has, toggle, remove, signOut, openSignIn: () => setOpen(true) }}
    >
      {children}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setError(null); setPending(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("signin_title")}</DialogTitle>
            <DialogDescription>{t("signin_intro")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("l_membership")}</Label>
              <Input
                value={card}
                onChange={(e) => { setCard(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") signIn(); }}
                placeholder={t("ph_membership")}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("ei_cancel")}</Button>
            <Button disabled={busy || !card.trim()} onClick={signIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
              {busy ? t("m_validating") : t("signin_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShortlistContext.Provider>
  );
}

export function useMemberShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error("useMemberShortlist must be used within MemberShortlistProvider");
  return ctx;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import type { ContactReveal } from "@/lib/types";

export function ContactCard({ profileId }: { profileId: string }) {
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();
  const [reveal, setReveal] = useState<ContactReveal | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!member) { setReveal(null); return; }
    setLoading(true);
    api
      .getContact(profileId, member.memberId)
      .then(setReveal)
      .catch(() => setReveal(null))
      .finally(() => setLoading(false));
  }, [member, profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function request() {
    if (!member) { openSignIn(); return; }
    setBusy(true);
    try {
      await api.requestContact(profileId, member.memberId);
      setReveal({ status: "Pending", mobile: null, isOwner: false });
      toast.success(t("c_req_sent"));
    } catch {
      toast.error(t("c_req_err"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4 p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-maroon">
        <Phone className="size-4" /> {t("c_title")}
      </h3>
      <Separator className="my-3" />

      {/* Revealed number - owner or approved */}
      {reveal?.mobile ? (
        <div>
          <a href={`tel:${reveal.mobile}`} className="text-[17px] font-bold tracking-wide text-foreground hover:text-maroon">
            {reveal.mobile}
          </a>
          {reveal.isOwner && <p className="mt-1 text-sm text-muted-foreground">{t("c_owner_note")}</p>}
        </div>
      ) : reveal?.status === "Pending" ? (
        <p className="text-sm font-medium text-amber-700">{t("c_pending")}</p>
      ) : reveal?.status === "Declined" ? (
        <p className="text-sm text-muted-foreground">{t("c_declined")}</p>
      ) : (
        // Not requested yet - or not signed in.
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" /> {t("c_locked")}
          </p>
          <Button
            onClick={request}
            disabled={busy || loading}
            className="bg-gold text-maroon hover:bg-gold! hover:brightness-105"
          >
            {busy ? t("c_requesting") : member ? t("c_request") : t("c_signin")}
          </Button>
        </div>
      )}
    </Card>
  );
}

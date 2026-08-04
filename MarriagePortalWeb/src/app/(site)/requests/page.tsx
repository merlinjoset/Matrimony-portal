"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import { api } from "@/lib/api";
import type { ContactRequest, ContactRequestStatus } from "@/lib/types";

function StatusPill({ status }: { status: ContactRequestStatus }) {
  const { t } = useT();
  const map: Record<ContactRequestStatus, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-brand-green/15 text-brand-green",
    Declined: "bg-destructive/10 text-destructive",
  };
  const label: Record<ContactRequestStatus, string> = {
    Pending: t("rq_pending"),
    Approved: t("rq_approved"),
    Declined: t("rq_declined"),
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}>{label[status]}</span>;
}

export default function RequestsPage() {
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();
  const [incoming, setIncoming] = useState<ContactRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<ContactRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!member) return;
    api.getIncomingContactRequests(member.memberId).then(setIncoming).catch(() => setIncoming([]));
    api.getOutgoingContactRequests(member.memberId).then(setOutgoing).catch(() => setOutgoing([]));
  }, [member]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, status: "Approved" | "Declined") {
    if (!member) return;
    setBusy(id);
    try {
      await api.setContactRequestStatus(id, member.memberId, status);
      setIncoming((rs) => (rs ? rs.map((r) => (r.id === id ? { ...r, status } : r)) : rs));
      toast.success(status === "Approved" ? t("rq_approve_ok") : t("rq_decline_ok"));
    } catch {
      toast.error(t("rq_action_err"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-2xl font-bold">{t("rq_h")}</h1>
      <p className="mb-6 mt-1 text-muted-foreground">{t("rq_sub")}</p>

      {ready && !member ? (
        <Card className="p-8 text-center">
          <p className="mb-4 text-muted-foreground">{t("rq_signin")}</p>
          <Button onClick={openSignIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
            {t("nav_signin")}
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Incoming - requests the signed-in member can approve */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-maroon">{t("rq_incoming")}</h2>
            {incoming === null ? (
              <Skeleton className="h-20 w-full" />
            ) : incoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("rq_empty_in")}</p>
            ) : (
              <div className="space-y-3">
                {incoming.map((r) => (
                  <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{r.requesterName}</span>
                        {r.requesterCongregation ? <span className="text-muted-foreground"> · {r.requesterCongregation}</span> : null}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {t("rq_wants")}{" "}
                        <Link href={`/profiles/${r.profileId}`} className="font-medium text-maroon hover:underline">
                          {r.profileName} ({r.profileReferenceId})
                        </Link>
                      </p>
                    </div>
                    {r.status === "Pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, "Approved")}
                          className="bg-brand-green text-white hover:bg-brand-green/90"
                        >
                          {t("rq_approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, "Declined")}
                          className="border-destructive/40 text-destructive hover:bg-destructive/5"
                        >
                          {t("rq_decline")}
                        </Button>
                      </div>
                    ) : (
                      <StatusPill status={r.status} />
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing - the member's own requests and their status */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-maroon">{t("rq_outgoing")}</h2>
            {outgoing === null ? (
              <Skeleton className="h-20 w-full" />
            ) : outgoing.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("rq_empty_out")}</p>
            ) : (
              <div className="space-y-3">
                {outgoing.map((r) => (
                  <Card key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                    <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">
                      {t("rq_youasked")}{" "}
                      <Link href={`/profiles/${r.profileId}`} className="font-medium text-maroon hover:underline">
                        {r.profileName} ({r.profileReferenceId})
                      </Link>
                    </p>
                    <StatusPill status={r.status} />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

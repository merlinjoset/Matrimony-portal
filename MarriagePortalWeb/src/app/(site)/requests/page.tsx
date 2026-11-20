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
import type { ContactRequest, ContactRequestStatus, InterestStatus, MemberInterest } from "@/lib/types";

/** Status of an Express Interest: Pending until the receiving family accepts or declines it. */
function InterestPill({ status }: { status: InterestStatus }) {
  const { t } = useT();
  const map: Record<InterestStatus, [string, string]> = {
    Awaiting: ["bg-amber-100 text-amber-800", t("ei_st_awaiting")],
    Accepted: ["bg-brand-green/15 text-brand-green", t("ei_st_accepted")],
    Declined: ["bg-muted text-muted-foreground", t("ei_st_declined")],
  };
  const [cls, label] = map[status] ?? map.Awaiting;
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function StatusPill({ status }: { status: ContactRequestStatus }) {
  const { t } = useT();
  const map: Record<ContactRequestStatus, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-brand-green/15 text-brand-green",
    Declined: "bg-destructive/10 text-destructive",
    Revoked: "bg-muted text-muted-foreground",
    Withdrawn: "bg-muted text-muted-foreground",
  };
  const label: Record<ContactRequestStatus, string> = {
    Pending: t("rq_pending"),
    Approved: t("rq_approved"),
    Declined: t("rq_declined"),
    Revoked: t("rq_revoked"),
    Withdrawn: t("rq_withdrawn"),
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}>{label[status]}</span>;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-maroon to-brand-green text-[11px] font-bold text-white shadow-sm">
      {initials(name)}
    </div>
  );
}

export default function RequestsPage() {
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();
  const [incoming, setIncoming] = useState<ContactRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<ContactRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [interests, setInterests] = useState<{ received: MemberInterest[]; sent: MemberInterest[] } | null>(null);

  const load = useCallback(() => {
    if (!member) return;
    api.getIncomingContactRequests(member.memberId).then(setIncoming).catch(() => setIncoming([]));
    api.getOutgoingContactRequests(member.memberId).then(setOutgoing).catch(() => setOutgoing([]));
    api.getMyInterests(member.memberId).then(setInterests).catch(() => setInterests({ received: [], sent: [] }));
  }, [member]);

  // "Groom · 30 yrs · Senior Accountant · Dubai"
  const summary = (x: MemberInterest) =>
    [x.gender === "Female" ? t("ei_bride") : x.gender === "Male" ? t("ei_groom") : null, x.age != null ? `${x.age} ${t("ei_yrs")}` : null, x.profession, x.city]
      .filter(Boolean)
      .join(" · ");

  useEffect(() => { load(); }, [load]);

  // Owners may revoke access only 2 days after they approved a request.
  const REVOKE_AFTER_MS = 2 * 24 * 60 * 60 * 1000;
  const canRevoke = (r: ContactRequest) => r.status === "Approved" && Date.now() - new Date(r.updatedAt).getTime() >= REVOKE_AFTER_MS;

  async function act(id: string, status: "Approved" | "Declined" | "Revoked") {
    if (!member) return;
    setBusy(id);
    try {
      await api.setContactRequestStatus(id, member.memberId, status);
      setIncoming((rs) => (rs ? rs.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r)) : rs));
      toast.success(status === "Approved" ? t("rq_approve_ok") : status === "Revoked" ? t("rq_revoke_ok") : t("rq_decline_ok"));
    } catch (e) {
      toast.error(String(e).replace(/^\d+:\s*/, "") || t("rq_action_err"));
    } finally {
      setBusy(null);
    }
  }

  // The family accepts or declines an Express Interest sent to their listing.
  async function answerInterest(id: string, status: "Accepted" | "Declined") {
    if (!member) return;
    setBusy(id);
    try {
      await api.respondToInterest(member.memberId, id, status);
      setInterests((cur) => (cur ? { ...cur, received: cur.received.map((x) => (x.id === id ? { ...x, status } : x)) } : cur));
      toast.success(status === "Accepted" ? t("ei_accept_ok") : t("ei_decline_ok"));
    } catch (e) {
      const err = e as { status?: number; message?: string };
      toast.error(err.status && err.message ? err.message : t("rq_action_err"));
    } finally {
      setBusy(null);
    }
  }

  // The sender withdraws their own request while it is still awaiting a response.
  async function cancel(id: string) {
    if (!member) return;
    setBusy(id);
    try {
      await api.cancelContactRequest(id);
      setOutgoing((rs) => (rs ? rs.filter((r) => r.id !== id) : rs));
      toast.success(t("rq_cancel_ok"));
    } catch (e) {
      toast.error(String(e).replace(/^\d+:\s*/, "") || t("rq_action_err"));
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
                  <Card key={r.id} className="flex flex-row flex-wrap items-center gap-3 px-3.5 py-2.5 transition hover:shadow-sm">
                    <Avatar name={r.requesterName} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="text-sm font-semibold">
                        {r.requesterName}
                        {r.requesterCongregation ? <span className="font-normal text-muted-foreground"> · {r.requesterCongregation}</span> : null}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {t("rq_wants")}{" "}
                        <Link href={`/profiles/${r.profileId}`} className="font-medium text-maroon hover:underline">
                          {r.profileName} ({r.profileReferenceId})
                        </Link>
                      </p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${r.requestType === "Photo" ? "bg-maroon/10 text-maroon" : "bg-brand-green/10 text-brand-green"}`}>
                        {r.requestType === "Photo" ? t("rq_type_photo") : t("rq_type_contact")}
                      </span>
                      {r.status === "Withdrawn" && (
                        <p className="mt-1 text-[11.5px] text-muted-foreground">{t("rq_withdrawn_note")}</p>
                      )}
                    </div>
                    {r.status === "Pending" ? (
                      <div className="flex shrink-0 gap-2">
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
                    ) : r.status === "Approved" ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill status={r.status} />
                        {canRevoke(r) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id}
                            onClick={() => act(r.id, "Revoked")}
                            className="border-destructive/40 text-destructive hover:bg-destructive/5"
                          >
                            {t("rq_revoke")}
                          </Button>
                        )}
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
                  <Card key={r.id} className="flex flex-row items-center gap-3 px-3.5 py-2.5 transition hover:shadow-sm">
                    <Avatar name={r.profileName} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <Link href={`/profiles/${r.profileId}`} className="text-sm font-semibold text-foreground hover:text-maroon hover:underline">
                        {r.profileName}
                      </Link>
                      <p className="text-[11.5px] text-muted-foreground">{r.profileReferenceId} · {t("rq_youasked_line")}</p>
                    </div>
                    {r.status === "Pending" ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill status={r.status} />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === r.id}
                          onClick={() => cancel(r.id)}
                          className="border-destructive/40 text-destructive hover:bg-destructive/5"
                        >
                          {t("rq_cancel")}
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

          {/* Express Interests received - the family accepts or declines them here */}
          <div>
            <h2 className="mb-1 text-lg font-semibold text-maroon">{t("ei_rx_h")}</h2>
            <p className="mb-3 text-[12.5px] text-muted-foreground">{t("ei_rx_note")}</p>
            {interests === null ? (
              <Skeleton className="h-20 w-full" />
            ) : interests.received.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ei_rx_empty")}</p>
            ) : (
              <div className="space-y-3">
                {interests.received.map((x) => (
                  <Card key={x.id} className="flex flex-row flex-wrap items-center gap-3 px-3.5 py-2.5 transition hover:shadow-sm">
                    <Avatar name={x.name} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="text-sm font-semibold">
                        {x.name}
                        {x.referenceId ? <span className="font-normal text-muted-foreground"> · {x.referenceId}</span> : null}
                      </p>
                      {summary(x) && <p className="text-[11.5px] text-muted-foreground">{summary(x)}</p>}
                      <p className="text-[11.5px] text-muted-foreground">
                        {t("ei_rx_line")}{" "}
                        <span className="font-medium text-maroon">{x.yourListingName}{x.yourListingRef ? ` (${x.yourListingRef})` : ""}</span>
                        {" · "}{shortDate(x.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {x.profileId && (
                        <Button size="sm" variant="outline" render={<Link href={`/profiles/${x.profileId}`} />} nativeButton={false}>
                          {t("ei_view")}
                        </Button>
                      )}
                      {x.status === "Awaiting" ? (
                        <>
                          <Button
                            size="sm"
                            disabled={busy === x.id}
                            onClick={() => answerInterest(x.id, "Accepted")}
                            className="bg-brand-green text-white hover:bg-brand-green/90"
                          >
                            {t("ei_accept")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === x.id}
                            onClick={() => answerInterest(x.id, "Declined")}
                            className="border-destructive/40 text-destructive hover:bg-destructive/5"
                          >
                            {t("ei_decline")}
                          </Button>
                        </>
                      ) : (
                        <InterestPill status={x.status} />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Express Interests the member sent, with the other family's answer - view only */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-maroon">{t("ei_tx_h")}</h2>
            {interests === null ? (
              <Skeleton className="h-20 w-full" />
            ) : interests.sent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("ei_tx_empty")}</p>
            ) : (
              <div className="space-y-3">
                {interests.sent.map((x) => (
                  <Card key={x.id} className="flex flex-row items-center gap-3 px-3.5 py-2.5 transition hover:shadow-sm">
                    <Avatar name={x.name} />
                    <div className="min-w-0 flex-1 leading-tight">
                      {x.profileId ? (
                        <Link href={`/profiles/${x.profileId}`} className="text-sm font-semibold text-foreground hover:text-maroon hover:underline">
                          {x.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold">{x.name}</span>
                      )}
                      <p className="text-[11.5px] text-muted-foreground">
                        {[x.referenceId, summary(x)].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">{t("ei_tx_line")} · {shortDate(x.createdAt)}</p>
                    </div>
                    <InterestPill status={x.status} />
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

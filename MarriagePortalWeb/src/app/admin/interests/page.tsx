"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader, Avatar, Pill } from "@/components/admin/admin-ui";
import { ConnectionFlow } from "@/components/admin/connection-flow";
import { api } from "@/lib/api";
import type { AdminContactRequest, Interest, InterestStatus } from "@/lib/types";

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

const tone = (s: InterestStatus) => (s === "Accepted" ? "green" : s === "Awaiting" ? "amber" : "grey");
const reqTone = (s: string) => (s === "Approved" ? "green" : s === "Pending" ? "amber" : s === "Declined" ? "red" : "grey");

/** A listing reference that links to its admin page, e.g. "CSI2025". */
function RefLink({ id, refId }: { id: string | null; refId: string | null }) {
  if (!refId) return <span className="text-muted-foreground">no listing</span>;
  return id ? (
    <Link href={`/admin/members/${id}`} className="font-semibold text-maroon hover:underline">{refId}</Link>
  ) : (
    <span className="font-semibold">{refId}</span>
  );
}

export default function InterestsPage() {
  const [rows, setRows] = useState<Interest[] | null>(null);
  const [requests, setRequests] = useState<AdminContactRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<"flow" | "lists">("flow");

  const load = useCallback(() => {
    // Loaded independently so a hiccup in one list never blanks the other.
    api.getInterests().then(setRows).catch(() => setRows([]));
    api.getAdminContactRequests().then(setRequests).catch(() => setRequests([]));
  }, []);
  useEffect(load, [load]);

  async function decide(id: string, status: InterestStatus) {
    setBusy(id);
    try {
      await api.setInterestStatus(id, status);
      toast.success(`Interest ${status.toLowerCase()}.`);
      load();
    } catch {
      toast.error("Action failed. Is the API running?");
    } finally {
      setBusy(null);
    }
  }

  // Email the family of the listing the interest was sent to, asking them to reply to the office.
  async function remind(x: Interest) {
    const again = x.reminderCount > 0 ? `\n\nThey were last reminded ${ago(x.lastReminderAt!)}.` : "";
    if (!window.confirm(
      `Send a reminder email to the family of ${x.toName} (${x.toReferenceId})?\n\n` +
      `It tells them the other family is interested, introduces that bride/groom and asks them to reply. ` +
      `The enquirer's number and message are not included.${again}`,
    )) return;
    setBusy(x.id);
    try {
      const r = await api.remindInterest(x.id);
      setRows((rs) => rs?.map((y) => (y.id === x.id ? { ...y, ...r } : y)) ?? null);
      toast.success(`Reminder sent to the family of ${x.toName}.`);
    } catch (e) {
      const err = e as { status?: number; message?: string };
      toast.error(err.status && err.message ? err.message : "Could not send the reminder. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <AdminHeader title="Interests" subtitle="Interests sent through the Express Interest form, and members' contact & photo requests." />
      <div className="space-y-7 p-7">
        <div className="inline-flex rounded-lg border border-border bg-white p-1">
          {([["flow", "Profile flow"], ["lists", "Lists"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${view === v ? "bg-maroon text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "flow" ? (
          rows === null || requests === null ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ConnectionFlow interests={rows} requests={requests} />
          )
        ) : (
        <>
        <section>
          <h3 className="mb-1 font-semibold">Expressed interests</h3>
          <p className="mb-3 text-[12.5px] text-muted-foreground">
            Sent with the Express Interest form. Contact details are released only when both sides accept.
          </p>
          <Card className="p-0">
            {rows === null ? (
              <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : rows.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">No interests yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-bold">From (enquirer)</th>
                    <th className="px-5 py-3 font-bold">Interested in</th>
                    <th className="px-5 py-3 font-bold">Sent</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((x, i) => (
                    <tr key={x.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={x.fromName} i={i} />
                          <div>
                            <div className="text-sm font-semibold">{x.fromName}</div>
                            <div className="text-[12px] text-muted-foreground">{x.fromMobile}</div>
                            <div className="text-[12px]">
                              <span className="text-muted-foreground">Listing: </span>
                              <RefLink id={x.fromProfileId} refId={x.fromReferenceId} />
                              {x.fromMatchedByMobile && (
                                <span className="ml-1 text-[11px] text-muted-foreground" title="Sent before the sender's account was recorded; matched by mobile number">(matched by mobile)</span>
                              )}
                            </div>
                            {x.message && <div className="mt-0.5 max-w-xs text-[12px] italic text-muted-foreground">“{x.message}”</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <div className="font-semibold">{x.toName}</div>
                        <div className="text-[12px]"><RefLink id={x.toProfileId} refId={x.toReferenceId} /></div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{ago(x.createdAt)}</td>
                      <td className="px-5 py-3"><Pill tone={tone(x.status)}>{x.status}</Pill></td>
                      <td className="px-5 py-3">
                        {x.status === "Awaiting" ? (
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" disabled={busy === x.id} onClick={() => decide(x.id, "Accepted")} className="bg-brand-green text-white hover:bg-brand-green/90">
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" disabled={busy === x.id} onClick={() => decide(x.id, "Declined")} className="border-destructive/40 text-destructive hover:bg-destructive/5">
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy === x.id}
                                onClick={() => remind(x)}
                                title={`Email the family of ${x.toName} (${x.toReferenceId}) about this interest`}
                                className="border-maroon/30 text-maroon hover:bg-maroon/5"
                              >
                                ✉️ Reminder email
                              </Button>
                            </div>
                            {x.lastReminderAt && (
                              <div className="mt-1 text-[11.5px] text-muted-foreground">
                                Reminded {ago(x.lastReminderAt)}{x.reminderCount > 1 ? ` (${x.reminderCount} times)` : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        </section>

        <section>
          <h3 className="mb-1 font-semibold">Contact &amp; photo requests</h3>
          <p className="mb-3 text-[12.5px] text-muted-foreground">
            Members asking to see another listing&apos;s contact number or photo. The listing&apos;s owner approves or declines these; shown here so the office can follow the activity.
          </p>
          <Card className="p-0">
            {requests === null ? (
              <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : requests.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">No contact or photo requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-bold">Requested by</th>
                    <th className="px-5 py-3 font-bold">Listing</th>
                    <th className="px-5 py-3 font-bold">Wants</th>
                    <th className="px-5 py-3 font-bold">Sent</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((r, i) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.requesterName} i={i} />
                          <div>
                            <div className="text-sm font-semibold">{r.requesterName}</div>
                            <div className="text-[12px]"><RefLink id={r.requesterProfileId} refId={r.requesterReferenceId} /></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <div className="font-semibold">{r.profileName}</div>
                        <div className="text-[12px]"><RefLink id={r.profileId} refId={r.profileReferenceId} /></div>
                      </td>
                      <td className="px-5 py-3 text-sm">{r.requestType === "Photo" ? "📷 Photo" : "📞 Contact number"}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{ago(r.createdAt)}</td>
                      <td className="px-5 py-3"><Pill tone={reqTone(r.status)}>{r.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        </section>
        </>
        )}
      </div>
    </>
  );
}

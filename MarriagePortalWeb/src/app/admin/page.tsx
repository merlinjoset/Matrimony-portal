"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader, Avatar, Pill, statusTone } from "@/components/admin/admin-ui";
import { GenderChart } from "@/components/admin/gender-chart";
import { api } from "@/lib/api";
import { LEVEL_LABEL, type ProfileListItem, type ProfileStats, type VerifyQueueItem } from "@/lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recent, setRecent] = useState<ProfileListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [queue, setQueue] = useState<VerifyQueueItem[] | null>(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.browseProfiles({ pageSize: 6 })])
      .then(([s, r]) => {
        setStats(s);
        setRecent(r.items);
      })
      .catch(() => setError(true));
    // Loaded separately so a queue hiccup never blanks the rest of the dashboard.
    api.getVerifyQueue().then(setQueue).catch(() => setQueue([]));
  }, []);

  // Group the pending profiles by the approval level they are waiting for (approvalLevel = levels done).
  const buckets: Record<1 | 2 | 3, VerifyQueueItem[]> = { 1: [], 2: [], 3: [] };
  (queue ?? []).forEach((m) => {
    const lv = Math.min(3, Math.max(1, (m.approvalLevel ?? 0) + 1)) as 1 | 2 | 3;
    buckets[lv].push(m);
  });

  const cards = [
    { icon: Users, n: stats?.total, label: "Total members", tone: "text-maroon" },
    { icon: Clock, n: stats?.pending, label: "Pending verification", tone: "text-[#9a6b00]" },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Overview of the matrimony service" />
      <div className="p-7">
        {error && (
          <p className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Could not reach the server. Please check your connection and try again.
          </p>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="p-5">
                <Icon className={`mb-2 size-5 ${c.tone}`} />
                <div className={`text-3xl font-extrabold ${c.tone}`}>
                  {c.n === undefined ? <Skeleton className="h-8 w-12" /> : c.n.toLocaleString()}
                </div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">
                  {c.label}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mb-6 p-5">
          <div className="mb-3 flex items-center gap-3">
            <div>
              <h3 className="font-semibold">Verification queue</h3>
              <p className="text-[12.5px] text-muted-foreground">Which profiles are waiting at each approval level</p>
            </div>
            <Button render={<Link href="/admin/verify" />} nativeButton={false} variant="ghost" size="sm" className="ml-auto">
              Open queue
            </Button>
          </div>
          {queue === null ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {([1, 2, 3] as const).map((lv) => (
                <div key={lv} className="rounded-lg border border-border bg-muted/20 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[12.5px] font-bold uppercase tracking-wide text-maroon">L{lv} · {LEVEL_LABEL[lv]}</div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{buckets[lv].length}</span>
                  </div>
                  {buckets[lv].length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground">None waiting</p>
                  ) : (
                    <ul className="space-y-1">
                      {buckets[lv].map((m) => (
                        <li key={m.id}>
                          <Link href={`/admin/members/${m.id}`} className="text-[13px] font-medium hover:text-maroon hover:underline">
                            {m.fullName} <span className="text-muted-foreground">({m.referenceId})</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="mb-6 p-5">
          <h3 className="font-semibold">Brides &amp; Grooms</h3>
          <p className="mb-4 text-[12.5px] text-muted-foreground">Verified profiles available for matching</p>
          {stats ? (
            <GenderChart brides={stats.brides} grooms={stats.grooms} />
          ) : (
            <Skeleton className="h-[150px] w-full max-w-sm" />
          )}
        </Card>

        <Card className="p-0">
          <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
            <h3 className="font-semibold">Latest registrations</h3>
            <Button render={<Link href="/admin/members" />} nativeButton={false} variant="ghost" size="sm" className="ml-auto">
              View all
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recent === null
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="size-9 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))
              : recent.map((m, i) => (
                  <Link key={m.id} href={`/admin/members/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                    <Avatar name={m.fullName} photo={m.mainPhotoUrl} i={i} />
                    <div>
                      <div className="text-sm font-semibold">{m.fullName}</div>
                      <div className="text-[12px] text-muted-foreground">{m.referenceId} · {m.congregation}</div>
                    </div>
                    <div className="ml-auto">
                      <Pill tone={statusTone(m.status)}>{m.status}</Pill>
                    </div>
                  </Link>
                ))}
          </div>
        </Card>
      </div>
    </>
  );
}

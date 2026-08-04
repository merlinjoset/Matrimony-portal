"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Clock, Heart, Gem } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader, Avatar, Pill, statusTone } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import type { ProfileListItem, ProfileStats } from "@/lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recent, setRecent] = useState<ProfileListItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.getStats(), api.browseProfiles({ pageSize: 6 })])
      .then(([s, r]) => {
        setStats(s);
        setRecent(r.items);
      })
      .catch(() => setError(true));
  }, []);

  const cards = [
    { icon: Users, n: stats?.total, label: "Total members", tone: "text-maroon" },
    { icon: Clock, n: stats?.pending, label: "Pending verification", tone: "text-[#9a6b00]" },
    { icon: Heart, n: 87, label: "Active interests", tone: "text-brand-green", sample: true },
    { icon: Gem, n: 320, label: "Holy matrimonies", tone: "text-maroon", sample: true },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Overview of the matrimony service" />
      <div className="p-7">
        {error && (
          <p className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Could not reach the API at http://localhost:5117. Start the backend to see live data.
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
                  {c.label} {c.sample && <span className="opacity-60">(sample)</span>}
                </div>
              </Card>
            );
          })}
        </div>

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

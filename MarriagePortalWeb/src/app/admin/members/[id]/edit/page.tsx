"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ProfileEditor } from "@/components/profile-editor";
import { api } from "@/lib/api";
import type { OwnProfileDetail } from "@/lib/types";

export default function AdminMemberEdit() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [profile, setProfile] = useState<OwnProfileDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    api.adminGetProfileForEdit(id)
      .then((p) => { if (alive) setProfile(p); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [id]);

  return (
    <>
      <AdminHeader title={profile ? `Edit ${profile.fullName}` : "Edit profile"} subtitle="Staff edit - keeps the current verification status" />
      <div className="p-7">
        <Link href={`/admin/members/${id}`} className="mb-4 inline-block text-sm font-semibold text-maroon">← Back to profile</Link>
        <Card className="p-6">
          {error ? (
            <p className="text-muted-foreground">Could not load this profile.</p>
          ) : !profile ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ProfileEditor
              initial={profile}
              onSave={(input) => api.adminUpdateProfile(id, input).then(() => {})}
              onSaved={() => router.push(`/admin/members/${id}`)}
              cancelHref={`/admin/members/${id}`}
            />
          )}
        </Card>
      </div>
    </>
  );
}

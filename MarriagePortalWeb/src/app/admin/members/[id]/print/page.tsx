"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProfileResume } from "@/components/admin/profile-resume";
import { api } from "@/lib/api";
import type { OwnProfileDetail } from "@/lib/types";

/** Printable resume for one profile. Admin-only: the admin layout gates this route server-side. */
export default function ProfileResumePage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<OwnProfileDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    api.adminGetProfileForEdit(id).then((x) => { if (alive) setP(x); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [id]);

  if (error) return <p className="p-8 text-muted-foreground">Could not load this profile.</p>;
  if (!p) return <p className="p-8 text-muted-foreground">Loading…</p>;
  return <ProfileResume p={p} backHref={`/admin/members/${id}`} />;
}

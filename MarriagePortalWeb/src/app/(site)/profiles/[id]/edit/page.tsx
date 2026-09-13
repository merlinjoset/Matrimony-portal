"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileEditor } from "@/components/profile-editor";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";
import type { OwnProfileDetail } from "@/lib/types";

export default function EditProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();

  const [profile, setProfile] = useState<OwnProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!member) { setLoading(false); setDenied(true); return; }
    let alive = true;
    setLoading(true);
    api.getOwnProfile(id, member.memberId)
      .then((p) => { if (alive) { setProfile(p); setDenied(false); } })
      .catch(() => { if (alive) setDenied(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ready, member, id]);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-12">
        <Card className="p-8 text-muted-foreground">{t("edit_loading")}</Card>
      </section>
    );
  }

  if (denied || !profile || !member) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-12">
        <Card className="space-y-4 p-8">
          <p className="text-muted-foreground">{member ? t("edit_denied") : t("edit_signin")}</p>
          <div className="flex gap-3">
            {!member && <Button onClick={openSignIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">{t("signin_btn")}</Button>}
            <Button variant="outline" render={<Link href={`/profiles/${id}`} />} nativeButton={false}>{t("edit_cancel")}</Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Card className="p-8">
        <h2 className="text-2xl font-bold">{t("edit_h")}</h2>
        <p className="mb-4 text-muted-foreground">{t("edit_sub")}</p>
        <ProfileEditor
          initial={profile}
          onSave={(input) => api.updateProfile(id, member.memberId, input).then(() => {})}
          onSaved={() => router.push(`/profiles/${id}`)}
          cancelHref={`/profiles/${id}`}
          reverifyNote
        />
      </Card>
    </section>
  );
}

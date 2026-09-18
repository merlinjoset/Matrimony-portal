"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";

/**
 * Members-only gate: renders children only when a member is signed in.
 * With `requireProfile`, the member's own profile must also be APPROVED (Verified/Active)
 * before they can view others - otherwise they are prompted to create it or wait for approval.
 */
type Gate = { hasProfile: boolean; approved: boolean; profileId: string | null };

export function MemberGate({
  children,
  requireProfile = false,
  ownerMemberId = null,
}: {
  children: React.ReactNode;
  requireProfile?: boolean;
  /** When the signed-in member owns this profile, they may view it regardless of approval state. */
  ownerMemberId?: string | null;
}) {
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();
  // null = unknown/loading, otherwise the resolved gate state.
  const [gate, setGate] = useState<Gate | null>(null);
  const isOwnProfile = !!(member && ownerMemberId && member.memberId === ownerMemberId);

  useEffect(() => {
    if (!requireProfile || !member || isOwnProfile) { setGate(null); return; }
    let live = true;
    setGate(null);
    api.hasProfile(member.memberId)
      .then((r) => { if (live) setGate({ hasProfile: r.hasProfile, approved: r.hasApprovedProfile, profileId: r.profileId }); })
      .catch(() => { if (live) setGate({ hasProfile: true, approved: true, profileId: null }); }); // fail open on a check error
    return () => { live = false; };
  }, [requireProfile, member, isOwnProfile]);

  // Until the stored session is restored, render nothing to avoid a flash.
  if (!ready) return null;

  if (!member) {
    return (
      <Prompt
        title={t("bg_title")}
        message={t("bg_msg")}
        primary={<Button onClick={openSignIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">{t("nav_signin")}</Button>}
        secondaryHref="/register"
        secondaryLabel={t("nav_register")}
      />
    );
  }

  if (requireProfile && !isOwnProfile) {
    if (gate === null) return null; // brief check; avoid flashing the wrong state
    if (!gate.hasProfile) {
      return (
        <Prompt
          title={t("pg_title")}
          message={t("pg_msg")}
          primary={
            <Button render={<Link href="/register" />} nativeButton={false} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
              {t("create_profile")}
            </Button>
          }
        />
      );
    }
    if (!gate.approved) {
      // Has a profile, but it is still Pending / Rejected / Suspended - can't view others yet.
      return (
        <Prompt
          title={t("pg_pending_title")}
          message={t("pg_pending_msg")}
          primary={
            <Button
              render={<Link href={gate.profileId ? `/profiles/${gate.profileId}` : "/"} />}
              nativeButton={false}
              className="bg-gold text-maroon hover:bg-gold! hover:brightness-105"
            >
              {t("pg_view_mine")}
            </Button>
          }
        />
      );
    }
  }

  return <>{children}</>;
}

function Prompt({
  title, message, primary, secondaryHref, secondaryLabel,
}: {
  title: string; message: string; primary: React.ReactNode; secondaryHref?: string; secondaryLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-20">
      <Card className="p-10 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-maroon/10">
          <Lock className="size-6 text-maroon" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {primary}
          {secondaryHref && secondaryLabel && (
            <Button render={<Link href={secondaryHref} />} nativeButton={false} variant="outline">
              {secondaryLabel}
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}

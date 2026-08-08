"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useMemberShortlist } from "@/lib/member-shortlist";

/**
 * Members-only gate: renders children only when a member is signed in.
 * Guests see a sign-in / register prompt instead.
 */
export function MemberGate({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { member, ready, openSignIn } = useMemberShortlist();

  // Until the stored session is restored, render nothing to avoid a flash.
  if (!ready) return null;

  if (!member) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-maroon/10">
            <Lock className="size-6 text-maroon" />
          </div>
          <h2 className="text-xl font-bold">{t("bg_title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("bg_msg")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={openSignIn} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
              {t("nav_signin")}
            </Button>
            <Button render={<Link href="/register" />} nativeButton={false} variant="outline">
              {t("nav_register")}
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return <>{children}</>;
}

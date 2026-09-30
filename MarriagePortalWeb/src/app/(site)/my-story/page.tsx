"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { youtubeId } from "@/lib/video";
import { useMemberShortlist } from "@/lib/member-shortlist";

// Self-service success-story editor. Available to a member once the parish has marked their
// profile as committed (married); saved content appears on the public Success stories page.
export default function MyStoryPage() {
  const { member, ready, openSignIn } = useMemberShortlist();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [testimony, setTestimony] = useState("");
  const [video, setVideo] = useState("");
  const [marriageDate, setMarriageDate] = useState("");
  const [tStatus, setTStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!member) { setLoading(false); return; }
    let live = true;
    (async () => {
      try {
        const p = await api.getMyProfile(member.memberId);
        if (!live) return;
        setProfileId(p?.id ?? null);
        setStatus(p?.status ?? null);
        if (p && p.status === "Committed") {
          const t = await api.getMyTestimony(p.id);
          if (!live) return;
          setTestimony(t.testimony ?? "");
          setVideo(t.testimonyVideoUrl ?? "");
          setMarriageDate(t.marriageDate ?? "");
          setTStatus(t.testimonyStatus ?? null);
        }
      } catch {
        // leave blank on error
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [ready, member]);

  async function save() {
    if (!profileId) return;
    setSaving(true);
    try {
      await api.setMyTestimony(profileId, testimony.trim() || null, video.trim() || null, marriageDate || null);
      setTStatus(testimony.trim() || video.trim() ? "Pending" : null);
      toast.success("Saved! Your story will appear once the parish approves it.");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading) return <section className="mx-auto max-w-2xl px-5 py-20" />;

  if (!member) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <Card className="p-10">
          <div className="mx-auto mb-3 text-3xl">💍</div>
          <h1 className="text-xl font-bold">Your success story</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in to manage your success story.</p>
          <Button onClick={openSignIn} className="mt-5 bg-gold text-maroon hover:bg-gold! hover:brightness-105">Sign in</Button>
        </Card>
      </section>
    );
  }

  if (status !== "Committed") {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <Card className="p-10">
          <div className="mx-auto mb-3 text-3xl">💍</div>
          <h1 className="text-xl font-bold">Your success story</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This space opens once the parish office marks your profile as married. You&apos;ll then be able to share your
            testimony, marriage date and a video of your special day here.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-14">
      <Card className="p-8">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">💍</span>
          <h1 className="text-2xl font-bold">Your success story</h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Congratulations on your marriage! Share a short testimony, your marriage date and a video link - it appears on
          our public Success stories page. Leave a field blank to clear it.
        </p>
        {tStatus === "Pending" && (
          <div className="mb-4 rounded-lg border border-amber-400/40 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            Your story is awaiting the parish&apos;s review - it will appear on the Success stories page once approved.
          </div>
        )}
        {tStatus === "Published" && (
          <div className="mb-4 rounded-lg border border-brand-green/30 bg-brand-green/10 px-3.5 py-2.5 text-sm text-brand-green">
            Your story is live on the Success stories page. 🎉 Editing it will send it back for a quick re-approval.
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your testimony</Label>
            <Textarea rows={6} value={testimony} onChange={(e) => setTestimony(e.target.value)} placeholder="e.g. We thank God for bringing us together through the parish…" />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Video link</Label>
              <Input type="url" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" />
            </div>
            <div className="space-y-1.5">
              <Label>Marriage date</Label>
              <Input type="date" value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} />
            </div>
          </div>
          {youtubeId(video) && (
            <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId(video)}`}
                title="Your testimony video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          )}
          <Button disabled={saving} onClick={save} className="bg-gold text-maroon hover:bg-gold! hover:brightness-105">
            {saving ? "Saving…" : "Save my story"}
          </Button>
        </div>
      </Card>
    </section>
  );
}

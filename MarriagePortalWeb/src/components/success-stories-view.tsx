"use client";

import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import type { SuccessStory } from "@/lib/types";

/** Pull the 11-char video id from common YouTube URL shapes (so we can embed it). */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

export function SuccessStoriesView({ stories }: { stories: SuccessStory[] }) {
  const { t } = useT();

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mx-auto mb-3.5 h-[3px] rounded bg-gold" style={{ width: 60 }} />
        <h1 className="text-3xl font-bold sm:text-4xl">{t("ss_h")}</h1>
        <p className="mt-2 text-muted-foreground">{t("ss_sub")}</p>
      </div>

      {stories.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("ss_empty")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {stories.map((s) => {
            const yt = s.testimonyVideoUrl ? youtubeId(s.testimonyVideoUrl) : null;
            return (
              <Card key={s.id} className="overflow-hidden p-0">
                {yt && (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${yt}`}
                      title={`${s.fullName} testimony`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                )}
                <div className="space-y-2.5 p-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💍</span>
                    <h2 className="text-lg font-bold text-maroon">{s.fullName}</h2>
                  </div>
                  {(s.city || s.congregation) && (
                    <p className="text-[12.5px] text-muted-foreground">{[s.city, s.congregation].filter(Boolean).join(" · ")}</p>
                  )}
                  {s.testimony && (
                    <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{s.testimony}</p>
                  )}
                  {s.testimonyVideoUrl && !yt && (
                    <a
                      href={s.testimonyVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:underline"
                    >
                      ▶ {t("ss_watch")}
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

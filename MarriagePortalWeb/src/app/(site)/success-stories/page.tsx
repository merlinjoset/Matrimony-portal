import { SuccessStoriesView } from "@/components/success-stories-view";
import { listSuccessStories } from "@/lib/server/queries";
import type { SuccessStory } from "@/lib/types";

export const dynamic = "force-dynamic";

// Public page: curated success stories (committed profiles the parish gave a testimony). It shows
// only the name + story + video - no photos, contact details or other PII.
export default async function SuccessStoriesPage() {
  let stories: SuccessStory[] = [];
  try {
    stories = await listSuccessStories();
  } catch {
    stories = [];
  }
  return <SuccessStoriesView stories={stories} />;
}

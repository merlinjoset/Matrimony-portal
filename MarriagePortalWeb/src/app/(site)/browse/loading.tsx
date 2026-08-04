import { Skeleton } from "@/components/ui/skeleton";
import { ProfileGridSkeleton } from "@/components/profile-card-skeleton";

export default function BrowseLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="ml-auto flex gap-2.5">
          <Skeleton className="h-9 w-[150px]" />
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
      </div>
      <ProfileGridSkeleton count={6} />
    </section>
  );
}

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <Skeleton className="mb-3 h-5 w-32" />
      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="mt-4 grid gap-2.5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="space-y-3 p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

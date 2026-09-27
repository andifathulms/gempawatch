import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Shaped like /regions: header, a filter row, then the card grid. */
export default function Loading() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

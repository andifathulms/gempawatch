import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

// Matches the region page: header, four stat tiles, then the 1/2 split.
export default function RegionLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.75rem]" />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-earth-border bg-earth-surface p-4 sm:p-5 lg:col-span-1">
          <Skeleton className="mb-4 h-3 w-32" />
          <Skeleton className="mx-auto h-28 w-48" />
          <div className="mt-5 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-5 lg:col-span-2">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </div>
      </div>

      <CardSkeleton lines={6} />
    </div>
  );
}

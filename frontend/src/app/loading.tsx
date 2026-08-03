import { Skeleton, CardSkeleton, MapSkeleton } from "@/components/ui/Skeleton";

// Mirrors the homepage's real geometry — hero, four stat tiles, then the
// 3/2 map-and-feed split. A skeleton that does not match the layout it stands
// in for causes exactly the content jump it exists to prevent.
export default function HomeLoading() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-earth-border bg-earth-surface px-5 py-8 sm:px-8 sm:py-12">
        <Skeleton className="h-7 w-64 rounded-full" />
        <Skeleton className="mt-6 h-12 w-3/4 max-w-lg" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-[3.25rem] w-full max-w-xl" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-12 w-44" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.75rem]" />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="rounded-xl border border-earth-border bg-earth-surface p-4 sm:p-5 lg:col-span-3">
          <Skeleton className="mb-3 h-3 w-48" />
          <MapSkeleton height={440} />
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton lines={7} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}

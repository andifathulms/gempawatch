import { PageHeaderSkeleton, MapSkeleton, Skeleton } from "@/components/ui/Skeleton";

// Matches the map page: header, three layer-toggle cards, then the map.
export default function MapLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <div className="rounded-xl border border-earth-border bg-earth-surface p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[5.25rem]" />
          ))}
        </div>
        <div className="mt-4">
          <MapSkeleton height={600} />
        </div>
      </div>
    </div>
  );
}

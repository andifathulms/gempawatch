import { PageHeaderSkeleton, CardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function RegionLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-earth-border bg-earth-surface p-4 lg:col-span-1">
          <Skeleton className="mx-auto h-40 w-40 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-4 w-32" />
          <div className="mt-4 space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
        </div>
      </div>
      <CardSkeleton lines={6} />
    </div>
  );
}

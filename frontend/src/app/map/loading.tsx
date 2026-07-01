import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <div className="rounded-xl border border-earth-border bg-earth-surface p-4">
        <Skeleton className="h-[520px] w-full" />
      </div>
    </div>
  );
}

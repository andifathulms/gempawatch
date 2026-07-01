import { PageHeaderSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function ExploreLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardSkeleton lines={8} />
        </div>
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}

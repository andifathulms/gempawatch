import { PageHeaderSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function TimelineLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={4} />
      <CardSkeleton lines={4} />
      <CardSkeleton lines={4} />
    </div>
  );
}

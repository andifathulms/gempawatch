import { PageHeaderSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function CompareLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardSkeleton lines={2} />
      <CardSkeleton lines={8} />
    </div>
  );
}

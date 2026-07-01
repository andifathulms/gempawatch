import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-earth-border bg-earth-surface p-6 sm:p-8">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="mt-4 h-9 w-3/4 max-w-lg" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-36" />
        </div>
        <Skeleton className="mt-5 h-11 w-full max-w-xl" />
      </div>

      <div className="rounded-xl border border-earth-border bg-earth-surface p-4">
        <Skeleton className="mb-3 h-3 w-48" />
        <Skeleton className="h-[360px] w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <CardSkeleton lines={6} />
        </div>
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}

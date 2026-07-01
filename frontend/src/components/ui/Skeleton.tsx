interface Props {
  className?: string;
}

// Placeholder shimmer block for loading states. Uses Tailwind's animate-pulse
// on a raised-surface tone so it reads as "content is coming".
export function Skeleton({ className }: Props) {
  return (
    <div
      className={`animate-pulse rounded-md bg-earth-raised/70 ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

// Header skeleton matching the PageHeader footprint.
export function PageHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-earth-border bg-earth-surface p-5 sm:p-6">
      <div className="space-y-3 pl-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>
    </div>
  );
}

// Card skeleton — bordered box with a few shimmer lines.
export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-earth-border bg-earth-surface p-4">
      <Skeleton className="mb-4 h-3 w-32" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

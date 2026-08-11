interface Props {
  className?: string;
}

/**
 * Placeholder block.
 *
 * A sweeping highlight rather than an opacity pulse: a pulse is the same
 * signal we use for disabled controls, whereas a sweep unambiguously means
 * "content is on its way".
 */
export function Skeleton({ className }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-earth-raised/70 ${className ?? ""}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

// Header skeleton matching the PageHeader footprint.
export function PageHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-earth-border bg-earth-surface px-5 py-6 sm:px-7 sm:py-7">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>
    </div>
  );
}

// Card skeleton — bordered box with a label rule and a few shimmer lines.
export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-earth-border bg-earth-surface p-4 sm:p-5">
      <Skeleton className="mb-4 h-3 w-32" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            // Ragged right edge, like real text — a stack of identical bars
            // reads as a table, which is usually not what is loading.
          />
        ))}
      </div>
    </div>
  );
}

/** Stand-in for a map while its client bundle loads. */
export function MapSkeleton({ height = 460 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border border-earth-border bg-earth-sunken"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="relative inline-flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-seismic-orange" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-seismic-orange" />
        </span>
        <span className="text-fluid-00 text-text-muted">Memuat peta…</span>
      </div>
    </div>
  );
}

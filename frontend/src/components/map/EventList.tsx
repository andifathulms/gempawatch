import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { FeltBadge } from "@/components/ui/FeltBadge";
import { PreliminaryTag } from "@/components/ui/PreliminaryTag";
import { EmptyState } from "@/components/ui/EmptyState";
import { absolute, depth, timeAgo } from "@/lib/format";
import type { EarthquakeEvent } from "@/lib/types";

interface Props {
  events: EarthquakeEvent[];
}

/**
 * The live feed.
 *
 * Timestamps are relative ("12 menit lalu") with the exact time on hover: the
 * only question a reader brings to this list is *how recently*, and a raw
 * locale datetime makes them do the subtraction themselves. The row leads with
 * time, since that is what it is sorted by, and the location gets the largest
 * type because it is what people scan for.
 */
export function EventList({ events }: Props) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Tidak ada gempa tercatat dalam 24 jam terakhir."
        description="Ini kabar baik. Feed diperbarui mengikuti kadensi pembaruan BMKG."
      />
    );
  }

  return (
    <ul className="divide-y divide-earth-border/70">
      {events.map((e) => (
        <li
          key={e.id}
          className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors duration-[130ms] hover:bg-earth-raised/50"
        >
          <MagnitudeBadge magnitude={e.magnitude} depthKm={e.depth_km} size={42} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-fluid-00 font-medium text-text-primary">
                {e.location_description || "Lokasi tidak tersedia"}
              </p>
              <time
                dateTime={e.event_time}
                title={absolute(e.event_time)}
                className="shrink-0 font-mono text-fluid-000 tabular-nums text-text-muted"
              >
                {timeAgo(e.event_time)}
              </time>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-fluid-000 text-text-muted">
              <span className="font-mono tabular-nums">{depth(e.depth_km)}</span>
              <span aria-hidden="true">·</span>
              <span>{e.source}</span>
              {e.is_preliminary && <PreliminaryTag />}
              {e.felt_reports && <FeltBadge />}
              {e.potensi_tsunami && (
                <span className="rounded border border-risk-red/40 bg-risk-red/10 px-1.5 py-0.5 text-fluid-000 font-semibold uppercase tracking-wide text-risk-red">
                  Potensi tsunami
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

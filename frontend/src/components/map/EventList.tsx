import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { FeltBadge } from "@/components/ui/FeltBadge";
import { PreliminaryTag } from "@/components/ui/PreliminaryTag";
import type { EarthquakeEvent } from "@/lib/types";

interface Props {
  events: EarthquakeEvent[];
}

export function EventList({ events }: Props) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Belum ada gempa tercatat dalam 24 jam terakhir.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-earth-border">
      {events.map((e) => (
        <li
          key={e.id}
          className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors duration-[130ms] hover:bg-earth-raised/50"
        >
          <MagnitudeBadge magnitude={e.magnitude} depthKm={e.depth_km} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">
              {e.location_description || "Lokasi tidak tersedia"}
            </p>
            <p className="flex items-center gap-2 text-xs text-text-muted">
              <span className="font-mono">{e.depth_km.toFixed(0)} km</span>
              <span>·</span>
              <span>{new Date(e.event_time).toLocaleString("id-ID")}</span>
              <span>·</span>
              <span>{e.source}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {e.is_preliminary && <PreliminaryTag />}
            {e.felt_reports && <FeltBadge />}
          </div>
        </li>
      ))}
    </ul>
  );
}

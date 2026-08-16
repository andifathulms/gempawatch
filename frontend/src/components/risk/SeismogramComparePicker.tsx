"use client";

import { useState } from "react";
import { RegionSeismogram } from "./RegionSeismogram";
import { api } from "@/lib/api";
import type { SeismogramEvent } from "@/lib/seismogram";

interface Option {
  slug: string;
  name: string;
}

interface Props {
  regionName: string;
  events: SeismogramEvent[];
  /** Every other region the reader can pick as the comparison trace. */
  options: Option[];
  /** Nearest of the app's three reference cities — see page.tsx. Empty string means no default comparison was available. */
  defaultReferenceSlug: string;
  defaultReferenceName: string;
  defaultReferenceEvents: SeismogramEvent[];
}

/**
 * One select, not the two-select-plus-swap `CompareSelector` form
 * (DESIGN.md §5.4, §8) — comparing *against* something is secondary to the
 * region this page is already about, so only the reference side is a choice.
 *
 * The default reference (nearest of Jakarta/Padang/Palu, computed server-side
 * in page.tsx) is fetched there too, so the first paint needs no client
 * round-trip — this component only re-fetches when the reader picks a
 * different reference.
 */
export function SeismogramComparePicker({
  regionName,
  events,
  options,
  defaultReferenceSlug,
  defaultReferenceName,
  defaultReferenceEvents,
}: Props) {
  const [refSlug, setRefSlug] = useState(defaultReferenceSlug);
  const [refName, setRefName] = useState(defaultReferenceName);
  const [refEvents, setRefEvents] = useState(defaultReferenceEvents);
  const [loading, setLoading] = useState(false);

  async function onChange(slug: string) {
    setRefSlug(slug);
    if (!slug) {
      setRefEvents([]);
      return;
    }
    const chosen = options.find((o) => o.slug === slug);
    setLoading(true);
    try {
      const timeline = await api.regionTimeline(slug);
      setRefName(chosen?.name ?? timeline.region.name);
      setRefEvents(
        timeline.events.map((e) => ({
          event_time: e.event_time,
          magnitude: e.magnitude,
          depth_km: e.depth_km,
          source: e.source,
        })),
      );
    } catch {
      // Reference stays on whatever last loaded successfully — a silently
      // reverted dropdown would be worse than a comparison trace that's one
      // selection behind.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="mb-3 flex flex-wrap items-center gap-2 text-fluid-00">
        <span className="text-text-secondary">Bandingkan dengan:</span>
        <select
          value={refSlug}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border border-earth-border bg-earth-dark/60 px-3 py-1.5 text-text-primary transition-colors focus:border-seismic-orange focus:outline-none"
        >
          <option value="">Tanpa pembanding</option>
          {options.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>
        {loading && <span className="text-fluid-000 text-text-muted">Memuat…</span>}
      </label>

      <RegionSeismogram
        regionName={regionName}
        events={events}
        comparison={refSlug ? { regionName: refName, events: refEvents } : null}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { RegionSeismogram } from "./RegionSeismogram";
import { api } from "@/lib/api";
import type { SeismogramEvent } from "@/lib/seismogram";

/**
 * The report's reference cities, as region slugs — the same three anchors the
 * scoring engine compares against (lib/engine/report.ts REFERENCE_CITIES) and
 * the region page uses, so "compared with Jakarta" means one thing app-wide.
 */
const REFERENCE_SLUGS: Record<string, string> = {
  Jakarta: "jakarta-pusat",
  Padang: "padang",
  Palu: "kota-palu",
};

interface Props {
  nearestRegion: { slug: string; name: string } | null;
  /** The report's comparison city ("Jakarta"); its trace is stacked below. */
  referenceCity?: string;
  /** Changes on every new result, replaying the pen-draw. */
  drawKey?: string;
}

type Trace = { name: string; events: SeismogramEvent[] };

function toEvents(t: Awaited<ReturnType<typeof api.regionTimeline>>): SeismogramEvent[] {
  return t.events.map((e) => ({
    event_time: e.event_time,
    magnitude: e.magnitude,
    depth_km: e.depth_km,
    source: e.source,
  }));
}

/**
 * The fifty-year record under a point result.
 *
 * The seismic record exists per admin region — there is no "50 km around this
 * exact pin" export — so this shows the nearest region's trace, said plainly
 * rather than presented as if computed for the exact point (the score is;
 * this isn't). Stacked on the same scales as the reference city the report
 * already compares against, so "higher than Jakarta" is visible, not just
 * stated (DESIGN.md §5.4).
 */
export function PointSeismogram({ nearestRegion, referenceCity, drawKey }: Props) {
  const [main, setMain] = useState<Trace | null>(null);
  const [ref, setRef] = useState<Trace | null>(null);
  const refSlug = referenceCity ? REFERENCE_SLUGS[referenceCity] : undefined;
  const showRef = refSlug && refSlug !== nearestRegion?.slug ? refSlug : undefined;

  useEffect(() => {
    setMain(null);
    setRef(null);
    if (!nearestRegion) return;
    let alive = true;
    api
      .regionTimeline(nearestRegion.slug)
      .then((t) => alive && setMain({ name: nearestRegion.name, events: toEvents(t) }))
      .catch(() => alive && setMain({ name: nearestRegion.name, events: [] }));
    if (showRef) {
      api
        .regionTimeline(showRef)
        .then((t) => alive && setRef({ name: t.region.name, events: toEvents(t) }))
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [nearestRegion?.slug, nearestRegion?.name, showRef]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!nearestRegion) return null;

  return (
    <section aria-labelledby="rekaman-titik">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="rekaman-titik" className="text-fluid-3 font-extrabold tracking-tight">
            Rekaman 1970–sekarang
          </h2>
          <p className="mt-1 max-w-[70ch] text-fluid-00 leading-relaxed text-ink-2">
            Satu garis per gempa: tinggi = magnitudo, warna = kedalaman. Catatan wilayah terdekat,{" "}
            {nearestRegion.name}
            {showRef ? ", di atas pembandingnya dengan skala yang sama." : "."}
          </p>
        </div>
        <Link
          href={`/region/${nearestRegion.slug}`}
          className="text-fluid-00 font-semibold text-ink underline underline-offset-4 hover:no-underline"
        >
          Profil lengkap {nearestRegion.name} →
        </Link>
      </div>
      <div className="mt-4">
        {main === null ? (
          <Skeleton className="h-64" />
        ) : (
          <RegionSeismogram
            regionName={main.name}
            events={main.events}
            comparison={ref ? { regionName: ref.name, events: ref.events } : null}
            drawKey={drawKey}
          />
        )}
      </div>
    </section>
  );
}

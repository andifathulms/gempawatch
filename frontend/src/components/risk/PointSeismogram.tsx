"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { RegionSeismogram } from "./RegionSeismogram";
import { api } from "@/lib/api";
import type { SeismogramEvent } from "@/lib/seismogram";

interface Props {
  nearestRegion: { slug: string; name: string } | null;
}

/**
 * The point risk-check answers for an arbitrary coordinate, but the seismic
 * record only exists per admin region — there is no "50km around this exact
 * pin" event export. This shows the nearest region's trace as the closest
 * available record, said plainly in the subtitle rather than presented as if
 * it were computed for the exact point (the score above it is; this isn't).
 *
 * Comparison mode (DESIGN.md §5.4) is intentionally not wired in here: doing
 * it properly needs the nearest region's own coordinates to pick a default
 * reference city, which RiskCheckReport does not carry, and chaining a second
 * region lookup just for that felt like more machinery than a secondary panel
 * on the point-check flow earns. Region pages already have the full
 * comparison seismogram; this is the point-check's own, simpler, view.
 */
export function PointSeismogram({ nearestRegion }: Props) {
  const [events, setEvents] = useState<SeismogramEvent[] | null>(null);

  useEffect(() => {
    setEvents(null);
    if (!nearestRegion) return;
    let cancelled = false;
    api
      .regionTimeline(nearestRegion.slug)
      .then((t) => {
        if (cancelled) return;
        setEvents(
          t.events.map((e) => ({
            event_time: e.event_time,
            magnitude: e.magnitude,
            depth_km: e.depth_km,
            source: e.source,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [nearestRegion?.slug]);

  if (!nearestRegion) return null;

  return (
    <Card
      title="Rekaman gempa 1970–sekarang"
      subtitle={`Catatan wilayah terdekat, ${nearestRegion.name} — pendekatan untuk titik ini, bukan radius persis yang dipakai skor di atas.`}
    >
      {events === null ? (
        <Skeleton className="h-48" />
      ) : (
        <RegionSeismogram regionName={nearestRegion.name} events={events} />
      )}
      <Link
        href={`/region/${nearestRegion.slug}`}
        className="mt-3 inline-block text-fluid-00 text-text-secondary underline underline-offset-2 transition-colors hover:text-seismic-bright"
      >
        Lihat profil lengkap {nearestRegion.name} →
      </Link>
    </Card>
  );
}

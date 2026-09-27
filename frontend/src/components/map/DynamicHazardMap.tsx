"use client";

import dynamic from "next/dynamic";
import type { GeoFeatureCollection, EarthquakeEvent, TsunamiZone } from "@/lib/types";

const HazardMap = dynamic(() => import("./HazardMap").then((m) => m.HazardMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface text-ink-3">
      Memuat peta bahaya…
    </div>
  ),
});

export function DynamicHazardMap(props: {
  faults: GeoFeatureCollection;
  events: EarthquakeEvent[];
  zones: TsunamiZone[];
}) {
  return <HazardMap {...props} />;
}

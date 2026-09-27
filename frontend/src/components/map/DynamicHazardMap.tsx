"use client";

import dynamic from "next/dynamic";
import type { GeoFeatureCollection, EarthquakeEvent, TsunamiZone } from "@/lib/types";
import type { RegionScorePoint } from "./HazardMap";

const HazardMap = dynamic(() => import("./HazardMap").then((m) => m.HazardMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center gw-paper-grid text-ink-3">
      Memuat peta bahaya…
    </div>
  ),
});

export function DynamicHazardMap(props: {
  faults: GeoFeatureCollection;
  events: EarthquakeEvent[];
  zones: TsunamiZone[];
  regions?: RegionScorePoint[];
}) {
  return <HazardMap {...props} />;
}

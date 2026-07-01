"use client";

import dynamic from "next/dynamic";
import type { EarthquakeEvent } from "@/lib/types";

// Leaflet touches `window`, so the map must be client-only (no SSR).
const LiveMap = dynamic(
  () => import("./LiveMap").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[460px] w-full items-center justify-center rounded-xl bg-earth-surface text-text-muted">
        Memuat peta…
      </div>
    ),
  },
);

export function DynamicLiveMap(props: {
  events: EarthquakeEvent[];
  height?: number;
  center?: [number, number];
  zoom?: number;
}) {
  return <LiveMap {...props} />;
}

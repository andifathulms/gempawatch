"use client";

import dynamic from "next/dynamic";
import type { EarthquakeEvent } from "@/lib/types";
import { MapSkeleton } from "@/components/ui/Skeleton";

// Leaflet touches `window`, so the map must be client-only (no SSR).
const LiveMap = dynamic(
  () => import("./LiveMap").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => <MapSkeleton height={440} />,
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

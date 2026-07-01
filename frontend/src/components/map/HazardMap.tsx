"use client";

import { useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { GeoFeatureCollection, EarthquakeEvent, TsunamiZone } from "@/lib/types";
import { depthColor, riskTierColor } from "@/lib/seismic";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

interface Props {
  faults: GeoFeatureCollection;
  events: EarthquakeEvent[];
  zones: TsunamiZone[];
}

type Layer = "faults" | "heatmap" | "tsunami";

// Full Indonesia hazard explorer: toggle fault lines / event density / tsunami zones.
export function HazardMap({ faults, events, zones }: Props) {
  const [active, setActive] = useState<Record<Layer, boolean>>({
    faults: true,
    heatmap: true,
    tsunami: false,
  });

  const toggle = (l: Layer) =>
    setActive((prev) => ({ ...prev, [l]: !prev[l] }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["faults", "heatmap", "tsunami"] as Layer[]).map((l) => (
          <button
            key={l}
            onClick={() => toggle(l)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              active[l]
                ? "border-seismic-orange bg-seismic-orange/15 text-seismic-orange"
                : "border-earth-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {l === "faults" ? "Sesar" : l === "heatmap" ? "Kepadatan Gempa" : "Zona Tsunami"}
          </button>
        ))}
      </div>

      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ height: 560, width: "100%", borderRadius: 12 }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />

        {active.faults && (
          <GeoJSON
            data={faults as never}
            style={{ color: "#E8743B", weight: 2, dashArray: "6 4" }}
          />
        )}

        {active.heatmap &&
          events.map((e) => (
            <CircleMarker
              key={e.id}
              center={[e.latitude, e.longitude]}
              radius={Math.max(2, e.magnitude - 2)}
              pathOptions={{
                color: depthColor(e.depth_km),
                fillColor: depthColor(e.depth_km),
                fillOpacity: 0.35,
                weight: 0,
              }}
            />
          ))}

        {active.tsunami &&
          zones.map((z) => (
            <CircleMarker
              key={z.region_id}
              center={[z.latitude, z.longitude]}
              radius={10}
              pathOptions={{
                color: riskTierColor(z.tsunami_risk_tier),
                fillColor: riskTierColor(z.tsunami_risk_tier),
                fillOpacity: 0.5,
                weight: 1,
              }}
            >
              <Tooltip>
                {z.region_name} — Tsunami: {z.tsunami_risk_tier}
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>

      <SourceAttribution />
    </div>
  );
}

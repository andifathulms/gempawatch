"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { depthColor, magnitudeSize } from "@/lib/seismic";
import type { EarthquakeEvent } from "@/lib/types";
import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

interface Props {
  events: EarthquakeEvent[];
  height?: number;
  center?: [number, number];
  zoom?: number;
}

// Homepage live map. Circle size = magnitude, color = depth (CLAUDE.md encoding).
// Warm-toned CartoDB Voyager base per the "Fault Line" map style.
export function LiveMap({
  events,
  height = 460,
  center = [-2.5, 118],
  zoom = 5,
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: 12 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {events.map((e) => (
        <CircleMarker
          key={e.id}
          center={[e.latitude, e.longitude]}
          radius={magnitudeSize(e.magnitude) / 4}
          pathOptions={{
            color: depthColor(e.depth_km),
            fillColor: depthColor(e.depth_km),
            fillOpacity: 0.55,
            weight: 1.5,
          }}
        >
          <Popup>
            <div className="min-w-[180px] space-y-2 text-earth-dark">
              <div className="flex items-center gap-2">
                <MagnitudeBadge magnitude={e.magnitude} depthKm={e.depth_km} size={36} />
                <div>
                  <p className="text-sm font-semibold">M{e.magnitude.toFixed(1)}</p>
                  <p className="text-xs">{e.depth_km.toFixed(0)} km</p>
                </div>
              </div>
              <p className="text-xs">{e.location_description}</p>
              <p className="text-[11px] text-gray-500">
                {new Date(e.event_time).toLocaleString("id-ID")}
              </p>
              <SourceAttribution sources={[e.source]} className="!text-[10px]" />
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

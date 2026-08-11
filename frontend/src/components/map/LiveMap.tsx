"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { depthColor, magnitudeSize } from "@/lib/seismic";
import { absolute, depth, timeAgo } from "@/lib/format";
import type { EarthquakeEvent } from "@/lib/types";
import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { FeltBadge } from "@/components/ui/FeltBadge";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

interface Props {
  events: EarthquakeEvent[];
  height?: number;
  center?: [number, number];
  zoom?: number;
}

/**
 * Homepage live map. Circle size = magnitude, colour = depth (CLAUDE.md).
 *
 * The base layer is CartoDB's dark matter rather than Voyager: a light basemap
 * under a dark UI turned the map into the brightest object on the page, which
 * pulled attention away from the markers that carry the actual information.
 * Markers are drawn newest-last so the most recent event sits on top of any
 * cluster.
 */
export function LiveMap({
  events,
  height = 440,
  center = [-2.5, 118],
  zoom = 5,
}: Props) {
  const ordered = [...events].sort(
    (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime(),
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: 12 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      {ordered.map((e) => (
        <CircleMarker
          key={e.id}
          center={[e.latitude, e.longitude]}
          radius={magnitudeSize(e.magnitude) / 4}
          pathOptions={{
            color: depthColor(e.depth_km),
            fillColor: depthColor(e.depth_km),
            fillOpacity: 0.45,
            weight: 1.5,
          }}
        >
          <Popup>
            <div className="min-w-[200px] space-y-2">
              <div className="flex items-center gap-2.5">
                <MagnitudeBadge magnitude={e.magnitude} depthKm={e.depth_km} size={38} />
                <div>
                  <p className="font-mono text-fluid-00 font-bold text-text-primary">
                    M{e.magnitude.toFixed(1)}
                  </p>
                  <p className="text-fluid-000 text-text-muted">
                    kedalaman {depth(e.depth_km)}
                  </p>
                </div>
              </div>
              <p className="text-fluid-000 leading-relaxed text-text-secondary">
                {e.location_description}
              </p>
              <p className="text-fluid-000 text-text-muted">
                <span aria-hidden="true">{timeAgo(e.event_time)}</span>
                <span className="sr-only">{absolute(e.event_time)}</span>
                {" · "}
                {e.source}
              </p>
              {e.felt_reports && <FeltBadge />}
              <SourceAttribution sources={[e.source]} variant="inline" />
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

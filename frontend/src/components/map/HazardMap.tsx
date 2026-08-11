"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import type { GeoFeatureCollection, EarthquakeEvent, TsunamiZone } from "@/lib/types";
import { DEPTH_BANDS, depthColor, riskTierColor, riskTierLabel } from "@/lib/seismic";
import { absolute, num, timeAgo } from "@/lib/format";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

interface Props {
  faults: GeoFeatureCollection;
  events: EarthquakeEvent[];
  zones: TsunamiZone[];
}

type LayerKey = "faults" | "events" | "tsunami";

/**
 * Full Indonesia hazard explorer.
 *
 * The toggles used to be three unlabelled pills reading "Sesar", "Kepadatan
 * Gempa", "Zona Tsunami" with nothing to say what any layer contained or how
 * much of it there was. They are now cards carrying a colour swatch, a
 * one-line description, and a feature count, so the reader can tell an empty
 * layer from one they have switched off — which the pills could not express.
 */
const LAYERS: {
  key: LayerKey;
  label: string;
  description: string;
  swatch: string;
  dashed?: boolean;
}[] = [
  {
    key: "faults",
    label: "Sesar aktif",
    description: "Garis patahan darat yang dipetakan.",
    swatch: "#E8743B",
    dashed: true,
  },
  {
    key: "events",
    label: "Gempa terkini",
    description: "Kejadian 24 jam terakhir, warna = kedalaman.",
    swatch: "#C0392B",
  },
  {
    key: "tsunami",
    label: "Zona tsunami historis",
    description: "Wilayah pesisir dengan riwayat gempa pemicu.",
    swatch: "#D4A12B",
  },
];

export function HazardMap({ faults, events, zones }: Props) {
  const [active, setActive] = useState<Record<LayerKey, boolean>>({
    faults: true,
    events: true,
    tsunami: false,
  });

  const counts: Record<LayerKey, number> = {
    faults: faults.features.length,
    events: events.length,
    tsunami: zones.length,
  };

  const toggle = (l: LayerKey) => setActive((prev) => ({ ...prev, [l]: !prev[l] }));

  return (
    <div className="space-y-4">
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="sr-only">Lapisan peta</legend>
        {LAYERS.map((l) => {
          const on = active[l.key];
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => toggle(l.key)}
              aria-pressed={on}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                on
                  ? "border-seismic-orange/60 bg-seismic-orange/[0.07]"
                  : "border-earth-border bg-earth-dark/40 hover:border-earth-border-strong"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-1 h-3 w-3 shrink-0 rounded-full transition-opacity ${on ? "" : "opacity-30"}`}
                style={{
                  backgroundColor: l.dashed ? "transparent" : l.swatch,
                  border: l.dashed ? `2px dashed ${l.swatch}` : undefined,
                }}
              />
              <span className="min-w-0">
                <span
                  className={`block text-fluid-00 font-medium ${on ? "text-text-primary" : "text-text-muted"}`}
                >
                  {l.label}
                </span>
                <span className="mt-0.5 block text-fluid-000 leading-snug text-text-muted">
                  {l.description}
                </span>
                <span className="mt-1 block font-mono text-fluid-000 tabular-nums text-text-muted">
                  {num(counts[l.key])} objek
                </span>
              </span>
            </button>
          );
        })}
      </fieldset>

      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ height: 600, width: "100%", borderRadius: 12 }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />

        {active.faults && (
          <GeoJSON
            data={faults as never}
            style={{ color: "#E8743B", weight: 2, dashArray: "6 4", opacity: 0.85 }}
            onEachFeature={(feature, layer) => {
              const name = (feature.properties as { name?: string })?.name;
              if (name) layer.bindTooltip(name, { sticky: true });
            }}
          />
        )}

        {active.events &&
          events.map((e) => (
            <CircleMarker
              key={e.id}
              center={[e.latitude, e.longitude]}
              radius={Math.max(3, e.magnitude - 1.5)}
              pathOptions={{
                color: depthColor(e.depth_km),
                fillColor: depthColor(e.depth_km),
                fillOpacity: 0.45,
                weight: 1,
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1">
                  <p className="font-mono text-fluid-00 font-bold text-text-primary">
                    M{e.magnitude.toFixed(1)} · {e.depth_km.toFixed(0)} km
                  </p>
                  <p className="text-fluid-000 text-text-secondary">
                    {e.location_description}
                  </p>
                  <p
                    className="text-fluid-000 text-text-muted"
                    title={absolute(e.event_time)}
                  >
                    {timeAgo(e.event_time)} · {e.source}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {active.tsunami &&
          zones.map((z) => (
            <CircleMarker
              key={z.region_id}
              center={[z.latitude, z.longitude]}
              radius={9}
              pathOptions={{
                color: riskTierColor(z.tsunami_risk_tier),
                fillColor: riskTierColor(z.tsunami_risk_tier),
                fillOpacity: 0.45,
                weight: 1,
              }}
            >
              <Tooltip>
                {z.region_name} — risiko tsunami historis:{" "}
                {riskTierLabel(z.tsunami_risk_tier)}
              </Tooltip>
              <Popup>
                <div className="space-y-1">
                  <p className="text-fluid-00 font-semibold text-text-primary">
                    {z.region_name}
                  </p>
                  <p className="text-fluid-000 text-text-secondary">
                    Risiko tsunami historis: {riskTierLabel(z.tsunami_risk_tier)}
                  </p>
                  <Link
                    href={`/region/${z.slug}`}
                    className="text-fluid-000 text-seismic-bright underline underline-offset-2"
                  >
                    Lihat profil risiko →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-fluid-000 text-text-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="flex items-end gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
            <span className="h-2.5 w-2.5 rounded-full bg-text-muted" />
            <span className="h-3.5 w-3.5 rounded-full bg-text-muted" />
          </span>
          Ukuran = magnitudo
        </span>
        {DEPTH_BANDS.map((b) => (
          <span key={b.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: b.color }}
            />
            <span className="text-text-secondary">{b.label}</span>
            <span className="font-mono text-fluid-000">{b.detail}</span>
          </span>
        ))}
      </div>

      <SourceAttribution />
    </div>
  );
}

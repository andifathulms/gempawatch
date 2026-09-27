"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
    Tooltip,
} from "react-leaflet";
import type { GeoFeatureCollection, EarthquakeEvent, RiskTier, TsunamiZone } from "@/lib/types";
import { prefersReducedMotion } from "@/lib/motion";
import { BaseMap, INDONESIA_BOUNDS } from "@/components/map/BaseMap";
import { DEPTH_BANDS, depthColor, riskTierColor, riskTierLabel } from "@/lib/seismic";
import { absolute, num, timeAgo } from "@/lib/format";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { QuakeHistoryLayer } from "./QuakeHistoryLayer";
import { RegionShadingLayer } from "./RegionShadingLayer";
import { countThrough, loadQuakes, type QuakeField } from "@/lib/quakes";

export interface RegionScorePoint {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  score: number;
  tier: RiskTier;
}

interface Props {
  faults: GeoFeatureCollection;
  events: EarthquakeEvent[];
  zones: TsunamiZone[];
  regions?: RegionScorePoint[];
}

type LayerKey = "history" | "faults" | "events" | "tsunami" | "scores";

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
    key: "history",
    label: "Rekaman 1970–kini",
    description: "Semua gempa M4.5+, warna = kedalaman. Putar per tahun di bawah.",
    swatch: "var(--depth-mid-fill)",
  },
  {
    key: "events",
    label: "Gempa terkini",
    description: "Kejadian 24 jam terakhir, warna = kedalaman.",
    swatch: "var(--depth-shallow-fill)",
  },
  {
    key: "faults",
    label: "Sesar aktif",
    description: "Garis patahan darat yang dipetakan.",
    swatch: "var(--ink)",
    dashed: true,
  },
  {
    key: "scores",
    label: "Skor per wilayah",
    description: "Kabupaten/kota terskor diarsir menurut tingkat aktivitas; makin pekat, makin tinggi skornya.",
    swatch: "var(--tier-high-fill)",
  },
  {
    key: "tsunami",
    label: "Zona tsunami historis",
    description: "Wilayah pesisir dengan riwayat gempa pemicu.",
    swatch: "var(--tier-mod-fill)",
  },
];

const FIRST_YEAR = 1970;

export function HazardMap({ faults, events, zones, regions = [] }: Props) {
  const [active, setActive] = useState<Record<LayerKey, boolean>>({
    history: true,
    faults: true,
    events: true,
    tsunami: false,
    scores: false,
  });
  const [field, setField] = useState<QuakeField | null>(null);
  const lastYear = useMemo(() => {
    if (!field) return new Date().getFullYear();
    let max = FIRST_YEAR;
    for (let i = 0; i < field.count; i++) if (field.year[i] > max) max = field.year[i];
    return max;
  }, [field]);
  const [year, setYear] = useState<number | null>(null);
  const shownYear = year ?? lastYear;
  const recorded = useMemo(() => (field ? countThrough(field, year ?? lastYear) : 0), [field, year, lastYear]);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadQuakes().then(setField);
  }, []);

  // Replay: one year per ~120 ms, 1970 → now. Reduced motion jumps to the end.
  useEffect(() => {
    if (!playing) return;
    if (prefersReducedMotion()) {
      setYear(null);
      setPlaying(false);
      return;
    }
    timer.current = setInterval(() => {
      setYear((y) => {
        const next = (y ?? FIRST_YEAR - 1) + 1;
        if (next >= lastYear) {
          setPlaying(false);
          return null;
        }
        return next;
      });
    }, 120);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, lastYear]);
  // Open on wide screens; on a phone the panel would cover most of the map.
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth >= 640);

  const counts: Record<LayerKey, number> = {
    history: field?.count ?? 0,
    scores: regions.length,
    faults: faults.features.length,
    events: events.length,
    tsunami: zones.length,
  };

  const toggle = (l: LayerKey) => setActive((prev) => ({ ...prev, [l]: !prev[l] }));

  const reduceMotion = prefersReducedMotion();

  return (
    <div className="relative h-full w-full">
      <MapContainer
        // Leaflet animates zoom/pan itself, out of reach of the CSS
        // reduced-motion rule that covers the rest of the site.
        zoomAnimation={!reduceMotion}
        markerZoomAnimation={!reduceMotion}
        fadeAnimation={!reduceMotion}
        center={[-2.5, 118]}
        // A phone at zoom 5 shows about a third of the archipelago.
        zoom={window.innerWidth < 640 ? 4 : 5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        minZoom={4}
        maxZoom={13}
        maxBounds={INDONESIA_BOUNDS}
        maxBoundsViscosity={0.8}
      >
        <BaseMap />

        {active.history && field && (
          <QuakeHistoryLayer field={field} yearTo={shownYear} highlightYear={year ?? undefined} />
        )}

        {active.scores && <RegionShadingLayer regions={regions} />}

        {active.faults && (
          <GeoJSON
            data={faults as never}
            style={{ color: "var(--ink)", weight: 1.5, dashArray: "6 4", opacity: 0.8 }}
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
                  <p className="font-mono text-fluid-00 font-bold text-ink">
                    M{e.magnitude.toFixed(1)} · {e.depth_km.toFixed(0)} km
                  </p>
                  <p className="text-fluid-000 text-ink-2">
                    {e.location_description}
                  </p>
                  <p className="text-fluid-000 text-ink-3">
                    <span aria-hidden="true">{timeAgo(e.event_time)}</span>
                    <span className="sr-only">{absolute(e.event_time)}</span>
                    {" · "}
                    {e.source}
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
                  <p className="text-fluid-00 font-semibold text-ink">
                    {z.region_name}
                  </p>
                  <p className="text-fluid-000 text-ink-2">
                    Risiko tsunami historis: {riskTierLabel(z.tsunami_risk_tier)}
                  </p>
                  <Link
                    href={`/region/${z.slug}`}
                    className="text-fluid-000 text-ink underline underline-offset-2"
                  >
                    Lihat profil risiko →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/*
        Floating, not stacked in normal flow (DESIGN.md §9: "full-bleed
        height... with the layer toggles floating over it"). pointer-events-
        none on the wrapper so clicks over the empty parts of the map still
        reach Leaflet; the panel itself opts back in.
      */}
      {/* Top-right, not top-left: Leaflet's own zoom control defaults to
          top-left, and stacking this panel on top of it made the "+/-"
          buttons unreachable. */}
      {/*
        w-72, not max-w-xs: shrink-to-fit on an absolutely positioned element
        with only `right` set (no `left`) let the toggle buttons' unwrapped
        preferred width win over the cap in practice, and the outer
        rounded-corner overflow-hidden then clipped them mid-word instead of
        wrapping. An explicit width removes the ambiguity.
      */}
      <div className="pointer-events-none absolute right-3 top-3 z-[900] w-72 max-w-[calc(100vw-1.5rem)] sm:right-4 sm:top-4">
        <div className="pointer-events-auto overflow-hidden rounded-xl border border-rule bg-surface shadow-md">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
          >
            <span className="font-display text-fluid-00 font-semibold text-ink">
              Lapisan peta
            </span>
            <span aria-hidden="true" className="text-fluid-000 text-ink-3">
              {panelOpen ? "▲" : "▼"}
            </span>
          </button>

          {panelOpen && (
            <fieldset className="space-y-1.5 border-t border-rule px-3 pb-3 pt-2.5">
              <legend className="sr-only">Lapisan peta</legend>
              {LAYERS.map((l) => {
                const on = active[l.key];
                return (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => toggle(l.key)}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                      on ? "border-ink bg-surface" : "border-rule bg-paper hover:border-rule-strong"
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
                        className={`block text-fluid-000 font-medium ${on ? "text-ink" : "text-ink-3"}`}
                      >
                        {l.label}
                      </span>
                      <span className="mt-0.5 block text-fluid-000 leading-snug text-ink-3">
                        {l.description}
                      </span>
                      <span className="mt-1 block font-mono text-fluid-000 tabular-nums text-ink-3">
                        {num(counts[l.key])} objek
                      </span>
                    </span>
                  </button>
                );
              })}
            </fieldset>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[900] space-y-2 sm:inset-x-4 sm:bottom-4">
        {active.history && field && (
          <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-rule bg-surface px-3.5 py-2.5 shadow-md">
            <button
              type="button"
              onClick={() => {
                if (!playing) setYear(FIRST_YEAR);
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "Jeda pemutaran" : "Putar rekaman dari 1970"}
              className="inline-flex min-h-tap-comfortable min-w-tap-comfortable items-center justify-center rounded-lg bg-ink text-on-ink hover:bg-ink/85"
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <rect x="2" y="1.5" width="3.5" height="11" fill="currentColor" />
                  <rect x="8.5" y="1.5" width="3.5" height="11" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 1.5v11l9-5.5z" fill="currentColor" />
                </svg>
              )}
            </button>
            <output htmlFor="year-scrub" className="w-[4ch] font-mono text-fluid-2 font-medium tabular-nums text-ink">
              {shownYear}
            </output>
            <label className="min-w-[10rem] flex-1">
              <span className="sr-only">Tampilkan gempa hingga tahun</span>
              <input
                id="year-scrub"
                type="range"
                min={FIRST_YEAR}
                max={lastYear}
                value={shownYear}
                onChange={(e) => {
                  setPlaying(false);
                  const v = Number(e.target.value);
                  setYear(v >= lastYear ? null : v);
                }}
                className="w-full accent-[rgb(var(--ink-c))]"
              />
            </label>
            <span className="text-fluid-00 text-ink-2">
              <b className="font-bold text-ink tabular-nums">{num(recorded)}</b> gempa M4.5+ hingga {shownYear}
              {year != null && " · lingkaran = gempa M5+ tahun itu"}
            </span>
          </div>
        )}
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-rule bg-surface px-3.5 py-2.5 text-fluid-000 text-ink-3 shadow-md">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="flex items-end gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-3" />
              <span className="h-3.5 w-3.5 rounded-full bg-ink-3" />
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
              <span className="text-ink-2">{b.label}</span>
              <span className="font-mono text-fluid-000">{b.detail}</span>
            </span>
          ))}
          <span className="w-full sm:w-auto">
            <SourceAttribution variant="inline" />
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import type { AdminRegion, RiskCheckReport } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { RegionSearch } from "@/components/discover/RegionSearch";
import { QuakeFieldCanvas } from "@/components/map/QuakeFieldCanvas";
import { RiskReportView } from "./RiskReportView";
import { DEPTH_BANDS, riskTierLabel } from "@/lib/seismic";
import { num } from "@/lib/format";
import type { Bbox } from "@/lib/quakes";

const PickerMap = dynamic(() => import("./PickerMap").then((m) => m.PickerMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sunken" />,
});

// Default pin: central Indonesia.
const DEFAULT: [number, number] = [-2.5, 118];

/** A few anchors so a first-time visitor can get a result without hunting. */
const SHORTCUTS: { label: string; at: [number, number] }[] = [
  { label: "Jakarta", at: [-6.2, 106.816] },
  { label: "Bandung", at: [-6.917, 107.619] },
  { label: "Yogyakarta", at: [-7.797, 110.37] },
  { label: "Padang", at: [-0.95, 100.354] },
  { label: "Palu", at: [-0.9, 119.87] },
  { label: "Banda Aceh", at: [5.548, 95.323] },
];

/** The ask panel floats over the stage's left side on wide screens. */
const PANEL_CLEARANCE = 460;

function bboxAround(lat: number, lng: number): Bbox {
  return [lng - 4.6, lat - 3, lng + 4.6, lat + 3];
}

/**
 * The homepage IS the risk check (DESIGN.md §2.2, §6).
 *
 * The first screen is the question floating over the answer's raw material:
 * every M4.5+ earthquake since 1970, drawn as dots with no basemap, so the
 * subduction arcs appear on their own. Choosing a place — by name, GPS, a
 * shortcut or the map — zooms that field onto the point and keeps colour only
 * inside the 100 km scoring radius, so the reader sees which events counted.
 * The full report then renders in place, full width, below.
 */
export function RiskCheckTool() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [report, setReport] = useState<RiskCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"field" | "map">("field");
  const [count, setCount] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const runCheck = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      setReport(await api.riskCheck(lat, lng));
    } catch {
      setError("Gagal menghitung risiko untuk titik ini. Coba lagi.");
    } finally {
      setLoading(false);
      // The result renders below the stage, out of view on a phone. Focusing
      // it moves keyboard users to the answer and scrolls it into view (the
      // browser's own scroll, which respects reduced motion). tabIndex={-1}
      // lets it take focus without joining the tab order.
      requestAnimationFrame(() => resultRef.current?.focus());
    }
  }, []);

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      runCheck(lat, lng);
    },
    [runCheck],
  );

  const pickRegion = useCallback(
    (r: AdminRegion) => handlePick(r.latitude, r.longitude),
    [handlePick],
  );

  const useGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Peramban ini tidak mendukung geolokasi.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handlePick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Izin lokasi ditolak. Kamu masih bisa mencari nama wilayah atau memilih di peta.");
      },
      { timeout: 10000 },
    );
  }, [handlePick]);

  const fit = (w: number, h: number): [number, number, number, number] =>
    w >= 1024 ? [PANEL_CLEARANCE, 40, w - PANEL_CLEARANCE - 20, h - 96] : [10, 10, w - 20, h - 20];

  return (
    <div className="space-y-14">
      <section
        aria-label="Cek risiko gempa"
        className="gw-paper-grid relative flex flex-col overflow-hidden rounded-2xl border border-rule lg:block lg:h-[620px]"
      >
        {/* Stage: the quake field, or the picker map on request. */}
        <div className="relative order-2 h-[340px] sm:h-[440px] lg:absolute lg:inset-0 lg:h-auto">
          {mode === "map" ? (
            <PickerMap
              position={position ?? DEFAULT}
              onPick={handlePick}
              height="100%"
              zoom={position ? 9 : 5}
            />
          ) : (
            <QuakeFieldCanvas
              className="h-full w-full"
              label={
                position
                  ? "Gempa M4.5+ sejak 1970 di sekitar titik terpilih; yang berada dalam radius 100 km tetap berwarna."
                  : "Peta Indonesia yang tersusun dari titik-titik gempa M4.5+ sejak 1970, warna menandai kedalaman."
              }
              fit={fit}
              bbox={position ? bboxAround(position[0], position[1]) : undefined}
              focus={position ? { lat: position[0], lon: position[1], radiusKm: 100 } : undefined}
              onLoad={setCount}
            />
          )}

          {mode === "field" && (
            <div className="pointer-events-none absolute right-4 top-4 hidden text-right sm:block">
              {position ? (
                <p className="max-w-[16rem] rounded-lg bg-paper/85 px-3 py-2 text-fluid-000 leading-snug text-ink-2 backdrop-blur-sm">
                  Lingkaran = radius 100 km yang dipakai skor. Gempa di luarnya dipudarkan.
                </p>
              ) : (
                count != null && (
                  <p className="text-fluid-000 text-ink-3">
                    <span className="block font-mono text-fluid-2 font-medium tabular-nums text-ink">
                      {num(count)}
                    </span>
                    gempa M4.5+ tercatat sejak 1970
                  </p>
                )
              )}
            </div>
          )}
        </div>

        {/* The question. */}
        <div className="relative z-[500] order-1 m-3 grid gap-4 rounded-xl border border-rule bg-paper/95 p-5 shadow-md backdrop-blur-sm sm:m-4 sm:p-6 lg:absolute lg:left-8 lg:top-8 lg:m-0 lg:w-[410px]">
          <p className="text-fluid-000 font-bold uppercase tracking-[0.14em] text-ink-3">Cek risiko gempa</p>
          <h1 className="text-fluid-4 font-extrabold leading-[1.04] tracking-[-0.03em]">
            Seberapa rawan gempa di tempatmu?
          </h1>
          <p className="text-fluid-00 leading-relaxed text-ink-2 sm:text-fluid-0">
            Skor 0–100 dari 50 tahun catatan BMKG &amp; USGS. Pola masa lalu, bukan ramalan.
          </p>
          <RegionSearch size="lg" placeholder="Cari kota atau kabupaten…" onSelect={pickRegion} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={useGeolocation} disabled={locating}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="10" cy="10" r="3" />
                <path d="M10 1.5v4M10 14.5v4M1.5 10h4M14.5 10h4" strokeLinecap="round" />
              </svg>
              {locating ? "Mencari lokasi…" : "Gunakan lokasiku"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setMode((m) => (m === "map" ? "field" : "map"))}
              aria-pressed={mode === "map"}
            >
              {mode === "map" ? "Tutup peta" : "Pilih di peta"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-fluid-000 text-ink-3">Coba:</span>
            {SHORTCUTS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => handlePick(s.at[0], s.at[1])}
                className="inline-flex min-h-[32px] items-center rounded-full border border-rule-strong bg-surface px-3 text-fluid-000 text-ink-2 transition-colors hover:border-ink hover:text-ink"
              >
                {s.label}
              </button>
            ))}
          </div>
          {(position || mode === "map") && (
            <p className="text-fluid-000 text-ink-3">
              {mode === "map" && !position && "Ketuk peta atau seret pin untuk memilih titik. "}
              {position && (
                <>
                  Titik:{" "}
                  <span className="font-mono tabular-nums text-ink-2">
                    {position[0].toFixed(4)}, {position[1].toFixed(4)}
                  </span>
                  {report?.nearest_region && !loading && <> · dekat {report.nearest_region.name}</>}
                  {loading && " · menghitung…"}
                </>
              )}
            </p>
          )}
        </div>

        {/* Legend: depth colours + sources, always on screen with the data. */}
        <div className="relative order-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule bg-paper/90 px-4 py-2.5 text-fluid-000 text-ink-2 lg:absolute lg:bottom-4 lg:right-4 lg:rounded-full lg:border lg:px-4 lg:py-1.5">
          <span className="text-ink-3">Kedalaman:</span>
          {DEPTH_BANDS.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
              {b.label} <span className="font-mono text-ink-3">{b.detail}</span>
            </span>
          ))}
          <SourceAttribution variant="inline" />
        </div>
      </section>

      {/* Announcements for assistive tech — loading, failure and the finished
          report all swap in visually without any other signal (WCAG 4.1.3). */}
      <p role="status" className="sr-only">
        {loading
          ? "Menghitung risiko untuk titik ini…"
          : error
            ? error
            : report
              ? `Laporan siap untuk ${report.nearest_region?.name ?? "titik terpilih"}. Skor aktivitas ${report.composite_score.toFixed(0)} dari 100, tingkat ${riskTierLabel(report.activity_tier)}.`
              : ""}
      </p>

      <div ref={resultRef} tabIndex={-1} className="scroll-mt-24 focus:outline-none">
        {loading && (
          <div className="grid gap-10 lg:grid-cols-2" aria-hidden="true">
            <div className="space-y-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-12 w-72" />
              <Skeleton className="h-28 w-60" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-40 w-full self-end" />
          </div>
        )}

        {error && !loading && (
          <EmptyState
            tone="warning"
            title={error}
            description="Titik di tengah laut atau di luar cakupan data Indonesia bisa memberi hasil kosong."
          />
        )}

        {report && !loading && position && (
          <RiskReportView report={report} lat={position[0]} lng={position[1]} animate />
        )}
      </div>
    </div>
  );
}

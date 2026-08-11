"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { riskResultPath } from "@/lib/routes";
import type { RiskCheckReport } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ShareableRiskCard } from "./ShareableRiskCard";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { riskTierLabel } from "@/lib/seismic";

const PickerMap = dynamic(() => import("./PickerMap").then((m) => m.PickerMap), {
  ssr: false,
  loading: () => <MapSkeleton height={440} />,
});

// Default pin: central Indonesia.
const DEFAULT: [number, number] = [-2.5, 118];

/** A few anchors so a first-time visitor can get a result without hunting. */
const SHORTCUTS: { label: string; at: [number, number] }[] = [
  { label: "Jakarta", at: [-6.2, 106.816] },
  { label: "Bandung", at: [-6.917, 107.619] },
  { label: "Yogyakarta", at: [-7.797, 110.37] },
  { label: "Palu", at: [-0.9, 119.87] },
  { label: "Banda Aceh", at: [5.548, 95.323] },
];

export function RiskCheckTool() {
  const [position, setPosition] = useState<[number, number]>(DEFAULT);
  const [report, setReport] = useState<RiskCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const runCheck = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.riskCheck(lat, lng);
      setReport(result);
    } catch {
      setError("Gagal menghitung risiko untuk titik ini. Coba lagi.");
    } finally {
      setLoading(false);
      // The result renders in a different subtree from the control that
      // triggered it, so without this a keyboard user is left on the shortcut
      // button with no idea anything happened, and a sighted phone user sees
      // nothing because the result sits below a 440px map. Focusing the result
      // solves both — the browser scrolls it into view as a side effect, and
      // it does so without the smooth behaviour that ignored
      // prefers-reduced-motion. The container takes tabIndex={-1} so it can
      // receive focus programmatically without entering the tab order.
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
        setError(
          "Izin lokasi ditolak. Kamu masih bisa mengetuk peta untuk memilih titik.",
        );
      },
      { timeout: 10000 },
    );
  }, [handlePick]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      {/* ---- Picker ------------------------------------------------------- */}
      <div className="space-y-4 lg:sticky lg:top-20">
        <Card
          title="Pilih titik"
          subtitle="Ketuk peta, seret pin, atau pakai lokasi GPS-mu."
          action={
            <Button
              onClick={useGeolocation}
              size="sm"
              disabled={locating}
            >
              {locating ? (
                "Mencari…"
              ) : (
                <>
                  <span aria-hidden="true">📍</span> Lokasi Saya
                </>
              )}
            </Button>
          }
          footer={<SourceAttribution variant="inline" />}
        >
          <PickerMap position={position} onPick={handlePick} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-earth-border bg-earth-dark/50 px-2.5 py-1 font-mono text-fluid-000 tabular-nums text-text-secondary">
              {position[0].toFixed(4)}, {position[1].toFixed(4)}
            </span>
            {loading && (
              <span className="text-fluid-000 text-text-muted">menghitung…</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="py-1 text-fluid-000 text-text-muted">Coba cepat:</span>
            {SHORTCUTS.map((s) => (
              <button
                key={s.label}
                onClick={() => handlePick(s.at[0], s.at[1])}
                className="inline-flex min-h-tap items-center rounded-full border border-earth-border px-3 py-1 text-fluid-000 text-text-secondary transition-colors hover:border-seismic-orange hover:text-seismic-bright"
              >
                {s.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ---- Result ------------------------------------------------------- */}
      {/*
        Status messages. Loading, failure and the finished report all swapped in
        silently before this: the skeleton is aria-hidden, "menghitung…" was
        plain text, and the report simply appeared. A blind user activated
        "Lokasi Saya" and the page seemed inert (WCAG 4.1.3).

        role="status" is the ARIA exception this pass allows: there is no native
        element that announces a region changing in place, and it carries an
        implicit aria-live="polite" so the announcement waits its turn.
      */}
      <p role="status" className="sr-only">
        {loading
          ? "Menghitung risiko untuk titik ini…"
          : error
            ? error
            : report
              ? `Laporan siap untuk ${report.nearest_region?.name ?? "titik terpilih"}. Skor aktivitas ${report.composite_score.toFixed(0)} dari 100, tingkat ${riskTierLabel(report.activity_tier)}.`
              : ""}
      </p>

      {/* No aria-label here: the status message above already names the
          outcome, and the card inside carries its own heading. */}
      <div
        ref={resultRef}
        tabIndex={-1}
        className="scroll-mt-20 space-y-4 focus:outline-none"
      >
        {loading && (
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-52" />
              <Skeleton className="mx-auto h-28 w-52" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <EmptyState
              tone="warning"
              title={error}
              description="Titik di tengah laut atau di luar cakupan data Indonesia bisa memberi hasil kosong."
            />
          </Card>
        )}

        {report && !loading && (
          <>
            <ShareableRiskCard report={report} />
            <ButtonLink
              href={riskResultPath(position[0], position[1])}
              size="lg"
              className="w-full"
            >
              Buka & bagikan hasil ini →
            </ButtonLink>
          </>
        )}

        {!report && !loading && !error && (
          <Card>
            <EmptyState
              title="Belum ada titik yang dipilih."
              description="Ketuk peta di sebelah, pakai tombol lokasi, atau pilih salah satu kota pintasan untuk melihat laporan risiko instan."
            />
          </Card>
        )}
      </div>
    </div>
  );
}

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
      // On a phone the result sits below a 440px map, so a successful check
      // otherwise appears to do nothing at all.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        requestAnimationFrame(() =>
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    } catch {
      setError("Gagal menghitung risiko untuk titik ini. Coba lagi.");
    } finally {
      setLoading(false);
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
              aria-label="Gunakan lokasi saya"
            >
              {locating ? "Mencari…" : "📍 Lokasi Saya"}
            </Button>
          }
          footer={<SourceAttribution variant="inline" />}
        >
          <PickerMap position={position} onPick={handlePick} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-earth-border bg-earth-dark/50 px-2.5 py-1 font-mono text-xs tabular-nums text-text-secondary">
              {position[0].toFixed(4)}, {position[1].toFixed(4)}
            </span>
            {loading && (
              <span className="text-xs text-text-muted">menghitung…</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="py-1 text-xs text-text-muted">Coba cepat:</span>
            {SHORTCUTS.map((s) => (
              <button
                key={s.label}
                onClick={() => handlePick(s.at[0], s.at[1])}
                className="rounded-full border border-earth-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-seismic-orange hover:text-seismic-bright"
              >
                {s.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ---- Result ------------------------------------------------------- */}
      <div ref={resultRef} className="scroll-mt-20 space-y-4">
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

"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import type { RiskCheckReport } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ShareableRiskCard } from "./ShareableRiskCard";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

const PickerMap = dynamic(() => import("./PickerMap").then((m) => m.PickerMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-xl bg-earth-surface text-text-muted">
      Memuat peta…
    </div>
  ),
});

// Default pin: central Indonesia.
const DEFAULT: [number, number] = [-2.5, 118];

export function RiskCheckTool() {
  const [position, setPosition] = useState<[number, number]>(DEFAULT);
  const [report, setReport] = useState<RiskCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.riskCheck(lat, lng);
      setReport(result);
    } catch {
      setError("Gagal menghitung risiko. Coba lagi.");
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
      setError("Peramban tidak mendukung geolokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePick(pos.coords.latitude, pos.coords.longitude),
      () => setError("Izin lokasi ditolak."),
    );
  }, [handlePick]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-text-secondary">
              Klik peta, seret pin, atau gunakan lokasi Anda.
            </p>
            <button
              onClick={useGeolocation}
              className="shrink-0 rounded-lg bg-seismic-orange px-3 py-1.5 text-sm font-semibold text-earth-dark hover:brightness-110"
            >
              📍 Lokasi Saya
            </button>
          </div>
          <PickerMap position={position} onPick={handlePick} />
          <p className="mt-2 font-mono text-xs text-text-muted">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </p>
        </Card>
        <SourceAttribution />
      </div>

      <div>
        {loading && (
          <Card>
            <p className="py-8 text-center text-text-muted">Menghitung risiko…</p>
          </Card>
        )}
        {error && !loading && (
          <Card>
            <p className="py-8 text-center text-risk-red">{error}</p>
          </Card>
        )}
        {report && !loading && <ShareableRiskCard report={report} />}
        {!report && !loading && !error && (
          <Card>
            <p className="py-8 text-center text-text-muted">
              Pilih titik pada peta untuk melihat laporan risiko.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

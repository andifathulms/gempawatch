"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { RiskScoreGauge } from "@/components/risk/RiskScoreGauge";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { api } from "@/lib/api";
import type { RegionRiskProfile } from "@/lib/types";

const ROWS: Array<{ label: string; get: (p: RegionRiskProfile) => string }> = [
  { label: "Skor aktivitas", get: (p) => (p.composite_score?.toFixed(0) ?? "—") + "/100" },
  {
    label: "Persentil",
    get: (p) => (p.activity_percentile != null ? `${p.activity_percentile}%` : "—"),
  },
  { label: "Gempa M4+", get: (p) => String(p.event_count_m4) },
  { label: "Gempa M5+", get: (p) => String(p.event_count_m5) },
  { label: "Gempa M6+", get: (p) => String(p.event_count_m6) },
  { label: "Terbesar", get: (p) => (p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—") },
  { label: "Kedalaman rata²", get: (p) => (p.avg_depth_km ? `${p.avg_depth_km.toFixed(0)} km` : "—") },
  { label: "Sesar terdekat", get: (p) => p.nearest_fault_name ?? "—" },
  {
    label: "Jarak sesar",
    get: (p) =>
      p.nearest_fault_distance_km != null ? `${p.nearest_fault_distance_km.toFixed(0)} km` : "—",
  },
];

/**
 * The side-by-side comparison, rendered client-side.
 *
 * The two regions are chosen with ?a=&b=, and a static host serves one HTML
 * file for every combination — so the selection has to be read in the browser
 * rather than on the server. Live deploys behave identically; only the moment
 * of rendering differs.
 */
export function CompareResult() {
  const searchParams = useSearchParams();
  const a = searchParams.get("a") ?? undefined;
  const b = searchParams.get("b") ?? undefined;

  const [profiles, setProfiles] = useState<RegionRiskProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!a || !b) {
      setProfiles([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .compareRegions([a, b])
      .then((r) => {
        if (!cancelled) setProfiles(r);
      })
      .catch(() => {
        if (!cancelled) setProfiles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [a, b]);

  if (!a || !b) return null;

  if (loading) {
    return (
      <Card>
        <p className="py-10 text-center text-text-muted">Memuat perbandingan…</p>
      </Card>
    );
  }

  if (profiles.length !== 2) {
    return (
      <p className="text-sm text-text-muted">
        Salah satu wilayah tidak ditemukan. Pilih ulang di atas.
      </p>
    );
  }

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        {profiles.map((p) => (
          <div key={p.region.slug} className="flex flex-col items-center gap-2">
            <Link
              href={`/region/${p.region.slug}`}
              className="text-center text-sm font-semibold text-text-primary hover:text-seismic-orange"
            >
              {p.region.name}
            </Link>
            <RiskScoreGauge
              score={p.composite_score}
              tier={p.activity_tier}
              percentile={p.activity_percentile}
              size={140}
            />
            <RiskTierBadge tier={p.tsunami_risk_tier} label="Tsunami" />
          </div>
        ))}
      </div>

      <table className="mt-6 w-full text-sm">
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-t border-earth-border">
              <td className="py-2 pr-2 text-right font-mono text-text-primary">
                {row.get(profiles[0])}
              </td>
              <td className="w-1/3 py-2 text-center text-xs text-text-muted">{row.label}</td>
              <td className="py-2 pl-2 font-mono text-text-primary">{row.get(profiles[1])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { RiskScoreGauge } from "@/components/risk/RiskScoreGauge";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { api } from "@/lib/api";
import { depth, magnitude, num } from "@/lib/format";
import type { RegionRiskProfile } from "@/lib/types";

/**
 * Comparison rows.
 *
 * `value` renders the cell; `compare` returns the number the two sides are
 * ranked on, or null where ranking is meaningless. Marking the higher side is
 * the whole job of a comparison table — without it the reader is left doing
 * digit-by-digit arithmetic across a gutter, which is exactly what the table
 * was supposed to spare them.
 *
 * "Higher" is not "worse" for every row, so the marker is neutral in colour and
 * labelled for screen readers as "nilai lebih tinggi", never as a winner.
 */
const ROWS: Array<{
  label: string;
  value: (p: RegionRiskProfile) => string;
  compare?: (p: RegionRiskProfile) => number | null;
  hint?: string;
}> = [
  {
    label: "Skor aktivitas",
    value: (p) => `${p.composite_score?.toFixed(0) ?? "—"}/100`,
    compare: (p) => p.composite_score,
  },
  {
    label: "Persentil nasional",
    value: (p) => (p.activity_percentile != null ? `${p.activity_percentile}%` : "—"),
    compare: (p) => p.activity_percentile,
  },
  {
    label: "Gempa M4+",
    value: (p) => num(p.event_count_m4),
    compare: (p) => p.event_count_m4,
  },
  {
    label: "Gempa M5+",
    value: (p) => num(p.event_count_m5),
    compare: (p) => p.event_count_m5,
  },
  {
    label: "Gempa M6+",
    value: (p) => num(p.event_count_m6),
    compare: (p) => p.event_count_m6,
  },
  {
    label: "Magnitudo terbesar",
    value: (p) => magnitude(p.largest_magnitude),
    compare: (p) => p.largest_magnitude,
  },
  {
    label: "Kedalaman rata-rata",
    value: (p) => depth(p.avg_depth_km),
    // Deeper is generally *less* damaging, so ranking this one would imply a
    // judgement the data does not support.
    hint: "Gempa dangkal umumnya lebih terasa di permukaan.",
  },
  { label: "Sesar aktif terdekat", value: (p) => p.nearest_fault_name ?? "—" },
  {
    label: "Jarak ke sesar",
    value: (p) =>
      p.nearest_fault_distance_km != null
        ? `${p.nearest_fault_distance_km.toFixed(0)} km`
        : "—",
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

  if (!a || !b) {
    return (
      <Card>
        <EmptyState
          title="Pilih dua wilayah untuk dibandingkan."
          description="Perbandingan berdampingan membantu menempatkan satu angka dalam konteks — skor 60 terasa berbeda di sebelah 30 dibanding di sebelah 90."
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </Card>
    );
  }

  if (profiles.length !== 2) {
    return (
      <Card>
        <EmptyState
          tone="warning"
          title="Salah satu wilayah tidak ditemukan."
          description="Pilih ulang kedua wilayah pada pemilih di atas."
        />
      </Card>
    );
  }

  const [left, right] = profiles;

  return (
    <Card title="Perbandingan berdampingan">
      {/* Stacked below sm:. Two columns of a fixed 150px gauge left ~120px per
          column at 320px, so the graphic overflowed its track (WCAG 1.4.10). */}
      <div className="grid gap-4 border-b border-earth-border pb-5 sm:grid-cols-2">
        {profiles.map((p) => (
          <div key={p.region.slug} className="flex flex-col items-center gap-2">
            <Link
              href={`/region/${p.region.slug}`}
              className="text-center font-display text-fluid-0 font-semibold text-text-primary transition-colors hover:text-seismic-bright"
            >
              {p.region.name}
            </Link>
            <RiskScoreGauge
              score={p.composite_score}
              tier={p.activity_tier}
              percentile={p.activity_percentile}
              percentileRegionCount={p.activity_percentile_basis?.region_count}
              size={150}
            />
            <RiskTierBadge tier={p.tsunami_risk_tier} label="Tsunami" size="sm" />
          </div>
        ))}
      </div>

      <table className="mt-2 w-full text-fluid-00">
        <caption className="sr-only">
          Perbandingan metrik risiko {left.region.name} dan {right.region.name}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{left.region.name}</th>
            <th scope="col">Metrik</th>
            <th scope="col">{right.region.name}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const lv = row.compare?.(left) ?? null;
            const rv = row.compare?.(right) ?? null;
            const leftHigher = lv != null && rv != null && lv > rv;
            const rightHigher = lv != null && rv != null && rv > lv;

            const cell = (higher: boolean) =>
              `py-2.5 font-mono tabular-nums ${
                higher ? "font-bold text-seismic-bright" : "text-text-primary"
              }`;

            return (
              <tr key={row.label} className="border-t border-earth-border/70">
                <td className={`${cell(leftHigher)} pr-3 text-right`}>
                  {leftHigher && (
                    <span className="sr-only">Nilai lebih tinggi: </span>
                  )}
                  {row.value(left)}
                </td>
                <th
                  scope="row"
                  className="w-2/5 px-2 py-2.5 text-center text-fluid-000 font-normal leading-snug text-text-muted"
                >
                  {row.label}
                  {row.hint && (
                    <span className="mt-0.5 block text-text-muted/80">{row.hint}</span>
                  )}
                </th>
                <td className={`${cell(rightHigher)} pl-3`}>
                  {rightHigher && (
                    <span className="sr-only">Nilai lebih tinggi: </span>
                  )}
                  {row.value(right)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-4 text-fluid-000 leading-relaxed text-text-muted">
        Nilai yang lebih tinggi ditandai dengan warna. Angka lebih tinggi tidak
        selalu berarti lebih berbahaya — jumlah kejadian dihitung dalam radius
        tetap dan tidak dinormalisasi terhadap luas wilayah maupun populasi.
      </p>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ISLANDS, type Island } from "@/lib/islands";
import { riskTierTextColor } from "@/lib/seismic";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { num } from "@/lib/format";
import type { RiskTier } from "@/lib/types";

export interface RegionIndexRow {
  slug: string;
  name: string;
  typeLabel: string;
  island: Island;
  score: number | null;
  tier: RiskTier | null;
  m5: number;
  largest: number | null;
  /** M5+ events as [fraction of 1970→now, magnitude, depth band 0/1/2]. */
  spikes: Array<[number, number, number]>;
}

type Sort = "score" | "name" | "m5";

const BAND_VAR = ["var(--depth-shallow-fill)", "var(--depth-mid-fill)", "var(--depth-deep-fill)"];

/**
 * A region's fifty-year M5+ record as a sparkline: same encoding as the
 * seismogram (height = magnitude on the shared curve, colour = depth), with a
 * fixed M5→M9 domain so every card is on the same scale and cards compare
 * honestly side by side.
 */
function MiniTrace({ spikes }: { spikes: RegionIndexRow["spikes"] }) {
  const H = 48;
  const h = (m: number) => Math.max(3, Math.pow(Math.max(0, m - 4.6) / 4.4, 1.2) * H);
  return (
    <svg viewBox={`0 0 1000 ${H}`} preserveAspectRatio="none" className="block h-12 w-full" aria-hidden="true">
      <line x1={0} x2={1000} y1={H - 0.5} y2={H - 0.5} stroke="var(--rule-strong)" vectorEffect="non-scaling-stroke" />
      {spikes.map(([x, m, b], i) => (
        <line
          key={i}
          x1={x * 1000}
          x2={x * 1000}
          y1={H}
          y2={H - h(m)}
          stroke={BAND_VAR[b]}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function RegionIndex({ rows }: { rows: RegionIndexRow[] }) {
  const [island, setIsland] = useState<Island | "Semua">("Semua");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("score");

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const r of rows) c.set(r.island, (c.get(r.island) ?? 0) + 1);
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => island === "Semua" || r.island === island)
      .filter((r) => !needle || r.name.toLowerCase().includes(needle))
      .sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name, "id")
          : sort === "m5"
            ? b.m5 - a.m5
            : (b.score ?? -1) - (a.score ?? -1),
      );
  }, [rows, island, q, sort]);

  const chip = (active: boolean) =>
    `inline-flex min-h-[34px] items-center gap-1.5 rounded-full border px-3.5 text-fluid-00 transition-colors ${
      active ? "border-ink bg-ink text-on-ink" : "border-rule-strong bg-surface text-ink-2 hover:border-ink hover:text-ink"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pulau">
          {(["Semua", ...ISLANDS] as const).map((name) => {
            const n = name === "Semua" ? rows.length : counts.get(name) ?? 0;
            if (n === 0) return null;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={island === name}
                onClick={() => setIsland(name)}
                className={chip(island === name)}
              >
                {name}
                <span className="font-mono text-fluid-000 tabular-nums opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-0 basis-full sm:w-64 sm:basis-auto">
            <span className="sr-only">Cari nama wilayah</span>
            <input
              id="region-filter"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama wilayah…"
              className="min-h-[40px] w-full rounded-lg border border-rule-strong bg-surface px-3 text-fluid-00 text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-fluid-00 text-ink-2">
            <span>Urutkan</span>
            <select
              id="region-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="min-h-[40px] rounded-lg border border-rule-strong bg-surface px-2.5 text-fluid-00 text-ink focus:border-ink focus:outline-none"
            >
              <option value="score">Skor tertinggi</option>
              <option value="m5">Gempa M5+ terbanyak</option>
              <option value="name">Nama A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <p className="text-fluid-00 text-ink-3" aria-live="polite">
        {shown.length} wilayah{island !== "Semua" ? ` di ${island}` : ""}
      </p>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-rule px-4 py-10 text-center text-fluid-00 text-ink-2">
          Tidak ada wilayah yang cocok dengan &ldquo;{q}&rdquo;.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/region/${r.slug}`}
                className="group grid h-full gap-3 rounded-xl border border-rule bg-surface p-4 transition-[border-color,transform] duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-ink"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-fluid-0 font-bold leading-tight text-ink">{r.name}</p>
                    <p className="text-fluid-000 text-ink-3">
                      {r.typeLabel} · {r.island}
                    </p>
                  </div>
                  <p
                    className="text-fluid-3 font-extrabold leading-none tabular-nums tracking-tight"
                    style={{ color: riskTierTextColor(r.tier) }}
                  >
                    {r.score != null ? Math.round(r.score) : "—"}
                  </p>
                </div>
                <MiniTrace spikes={r.spikes} />
                <div className="flex items-center justify-between gap-2 text-fluid-000 text-ink-3">
                  <RiskTierBadge tier={r.tier} size="sm" />
                  <span>
                    {num(r.m5)} gempa M5+
                    {r.largest != null && ` · maks M${r.largest.toFixed(1)}`}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

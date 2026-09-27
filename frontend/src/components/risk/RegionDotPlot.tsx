"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { LeaderboardRow } from "@/lib/types";

interface Props {
  /** The score being placed — a point's, or the region page's own. */
  score: number;
  /** Label next to the highlighted mark, e.g. "Titik ini" or "Kota Palu". */
  label: string;
  /** When the score belongs to a scored region, its dot is the one ringed. */
  slug?: string;
  /** Regions to plot; fetched from the leaderboard export when omitted. */
  rows?: LeaderboardRow[];
}

/** Always shown for orientation — the capital, if it is in the scored set. */
const ANCHOR_SLUG = "jakarta-pusat";

let rowsCache: Promise<LeaderboardRow[]> | null = null;
function loadRows(): Promise<LeaderboardRow[]> {
  if (!rowsCache) {
    // The export caps each ordering at 50, so both are merged to cover every
    // scored region (same reasoning as the region page's rank row).
    rowsCache = Promise.all([
      api.leaderboard(50, "desc").then((r) => r.results).catch(() => []),
      api.leaderboard(50, "asc").then((r) => r.results).catch(() => []),
    ]).then(([a, b]) => {
      const bySlug = new Map<string, LeaderboardRow>();
      for (const r of [...a, ...b]) bySlug.set(r.slug, r);
      return Array.from(bySlug.values());
    });
  }
  return rowsCache;
}

/**
 * Where this score sits among every scored region — one dot per region on a
 * 0–100 axis, stacked where they collide, coloured by tier.
 *
 * DESIGN.md §0 names the missing referent as the product's core problem: a
 * semicircle gauge reading 89 means nothing to someone in Cianjur. Risk is
 * comparative, so the answer shows the comparison instead of describing it —
 * the reader sees the pile of low-activity regions and where this one sits.
 */
export function RegionDotPlot({ score, label, slug, rows: given }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(given ?? null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (given) return;
    let alive = true;
    loadRows().then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [given]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scored = (rows ?? []).filter((r) => r.composite_score != null);
  const higher = scored.filter((r) => r.composite_score > score).length;

  const H = 150;
  const base = 104;
  const pad = 10;
  const r = width < 420 ? 3.8 : 4.6;
  const step = r * 2.25;
  const x = (v: number) => pad + (Math.max(0, Math.min(100, v)) / 100) * (width - pad * 2);
  // Bin width chosen so neighbouring stacks never overlap at this width.
  const bins = Math.max(12, Math.floor((width - pad * 2) / (r * 2.4)));
  const binW = 100 / bins;

  const stacks = new Map<number, number>();
  const placed = [...scored]
    .sort((a, b) => a.composite_score - b.composite_score)
    .map((row) => {
      const b = Math.min(bins - 1, Math.floor(row.composite_score / binW));
      const n = stacks.get(b) ?? 0;
      stacks.set(b, n + 1);
      return { row, cx: x((b + 0.5) * binW), cy: base - 8 - n * step };
    });
  const tallest = placed.reduce((m, p) => Math.min(m, p.cy), base);
  const self = slug ? placed.find((p) => p.row.slug === slug) : undefined;
  const hx = self?.cx ?? x(score);
  const hy = self?.cy ?? tallest - 6;
  const anchor = placed.find((p) => p.row.slug === ANCHOR_SLUG && p.row.slug !== slug);
  const endAnchor = (px: number) => (px > width * 0.62 ? "end" : "start");

  return (
    <figure className="m-0">
      <div ref={boxRef} className="w-full">
        {width > 0 && (
          <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true" className="block">
            {placed.map(({ row, cx, cy }) => (
              <circle key={row.slug} cx={cx} cy={cy} r={r} fill={riskTierColor(row.activity_tier)} />
            ))}
            <line x1={pad} x2={width - pad} y1={base} y2={base} stroke="var(--rule-strong)" />
            {[0, 25, 50, 75, 100].map((v) => (
              <text
                key={v}
                x={x(v)}
                y={base + 17}
                textAnchor={v === 0 ? "start" : v === 100 ? "end" : "middle"}
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill="var(--ink-3)"
              >
                {v}
              </text>
            ))}

            {/* This place: a ringed dot (or a tick, for a point between regions). */}
            {self ? (
              <circle cx={hx} cy={hy} r={r + 3.5} fill="none" stroke="var(--ink)" strokeWidth={2} />
            ) : (
              <line x1={hx} x2={hx} y1={hy} y2={base} stroke="var(--ink)" strokeWidth={2} />
            )}
            <text
              x={hx + (endAnchor(hx) === "end" ? -10 : 10)}
              y={Math.max(14, hy - 8)}
              textAnchor={endAnchor(hx)}
              fontSize={13}
              fontWeight={700}
              fill="var(--ink)"
            >
              {label} · {Math.round(score)}
            </text>

            {anchor && (
              <>
                <line x1={anchor.cx} x2={anchor.cx} y1={base + 3} y2={base + 26} stroke="var(--rule-strong)" />
                <text
                  x={anchor.cx + (endAnchor(anchor.cx) === "end" ? -5 : 5)}
                  y={base + 38}
                  textAnchor={endAnchor(anchor.cx)}
                  fontSize={12}
                  fill="var(--ink-2)"
                >
                  {anchor.row.region_name} · {Math.round(anchor.row.composite_score)}
                </text>
              </>
            )}
          </svg>
        )}
        {width === 0 && <div style={{ height: H }} />}
      </div>
      <figcaption className="mt-1 text-fluid-00 leading-relaxed text-ink-2">
        {scored.length > 0 ? (
          <>
            {higher === 0 ? (
              <>Tidak ada wilayah dengan skor lebih tinggi</>
            ) : (
              <>
                <b className="font-semibold text-ink">{higher}</b> dari {scored.length} wilayah punya skor lebih tinggi
              </>
            )}
            . Satu titik = satu wilayah yang sudah diskor di sini, warnanya tingkat aktivitasnya (
            {["HIGH", "MODERATE", "LOW"].map((t, i) => (
              <span key={t}>
                {i > 0 && ", "}
                <span
                  aria-hidden="true"
                  className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ backgroundColor: riskTierColor(t) }}
                />
                {riskTierLabel(t).toLowerCase()}
              </span>
            ))}
            ).
          </>
        ) : (
          <>Memuat perbandingan wilayah…</>
        )}
      </figcaption>
    </figure>
  );
}

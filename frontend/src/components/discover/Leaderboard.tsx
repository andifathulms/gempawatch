import Link from "next/link";
import {
  riskTierColor,
  riskTierTextColor,
  riskTierLabel,
  onFillTextColor,
} from "@/lib/seismic";
import { magnitude, num } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LeaderboardRow } from "@/lib/types";

interface Props {
  rows: LeaderboardRow[];
  /** `compact` drops the secondary stat line, for homepage previews. */
  variant?: "default" | "compact";
}

/**
 * Ranked region list — shareable listicle content and the main discovery path
 * for readers who don't have a specific place in mind.
 *
 * Each row draws its score as a bar behind the content. A column of bare
 * numbers makes the reader compare digits; a bar makes the gap between rank 1
 * and rank 12 visible in one pass, which is the entire reason a leaderboard is
 * a leaderboard.
 *
 * Bars are scaled against the fixed 0–100 range, never against the maximum in
 * the current list. Rescaling per list would draw Surabaya's 23 as a full-width
 * bar in the "least active" panel — the same visual language saying the
 * opposite thing one card away.
 */
export function Leaderboard({ rows, variant = "default" }: Props) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Peringkat belum tersedia."
        description="Profil risiko dihitung ulang setiap malam. Coba lagi nanti."
      />
    );
  }

  const compact = variant === "compact";

  return (
    <ol className="space-y-1">
      {rows.map((r) => {
        const fill = riskTierColor(r.activity_tier);
        const text = riskTierTextColor(r.activity_tier);
        return (
          <li key={r.slug}>
            <Link
              href={`/region/${r.slug}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-lg px-2.5 py-2.5 transition-colors hover:bg-earth-raised/60"
            >
              {/* Score bar, drawn behind the row content. */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 origin-left animate-draw-in rounded-lg transition-opacity group-hover:opacity-90"
                style={{
                  width: `${Math.max(2, Math.min(100, r.composite_score))}%`,
                  background: `linear-gradient(90deg, ${fill}26, ${fill}08)`,
                }}
              />

              <span className="relative w-5 shrink-0 text-center font-mono text-xs tabular-nums text-text-muted">
                {r.rank}
              </span>

              <span
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold tabular-nums"
                style={{ backgroundColor: fill, color: onFillTextColor(fill) }}
                title={`Skor aktivitas ${r.composite_score.toFixed(0)} dari 100`}
              >
                {r.composite_score.toFixed(0)}
              </span>

              <span className="relative min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text-primary">
                  {r.region_name}
                </span>
                {!compact && (
                  <span className="block truncate text-xs text-text-muted">
                    {num(r.event_count_m4)} gempa M4+ · terbesar{" "}
                    {magnitude(r.largest_magnitude)}
                  </span>
                )}
              </span>

              <span
                className="relative shrink-0 text-xs font-medium"
                style={{ color: text }}
              >
                {riskTierLabel(r.activity_tier)}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

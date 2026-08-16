import {
  riskTierColor,
  riskTierTextColor,
  riskTierLabel,
  onFillTextColor,
} from "@/lib/seismic";
import { num } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

interface Props {
  row: LeaderboardRow;
  total: number;
}

/**
 * Where this region sits among every region GempaWatch has scored — a single
 * positioned row, not the list `/explore`'s Leaderboard used to show
 * (DESIGN.md §7 item 5, §10 step 5). Same visual language as a Leaderboard
 * row (score bar, badge, tier) so it reads as a fragment of that ranking
 * rather than a new kind of object, plus the position track underneath,
 * which a bare "#7" cannot show on its own: seventh out of nine reads very
 * differently from seventh out of two hundred.
 */
export function RegionRankRow({ row, total }: Props) {
  const fill = riskTierColor(row.activity_tier);
  const text = riskTierTextColor(row.activity_tier);
  // 0 at the most active end, 1 at the least active end — same direction
  // Leaderboard's own bars already use (bigger score, bigger bar, first row).
  const position = total > 1 ? (row.rank - 1) / (total - 1) : 0;

  return (
    <div>
      <div className="relative flex items-center gap-3 overflow-hidden rounded-lg px-2.5 py-2.5">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 origin-left animate-draw-in rounded-lg"
          style={{
            width: `${Math.max(2, Math.min(100, row.composite_score))}%`,
            background: `linear-gradient(90deg, ${fill}26, ${fill}08)`,
          }}
        />

        <span className="relative w-8 shrink-0 text-center font-mono text-fluid-00 tabular-nums text-text-muted">
          #{row.rank}
        </span>

        <span
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-fluid-00 font-bold tabular-nums"
          style={{ backgroundColor: fill, color: onFillTextColor(fill) }}
        >
          <span aria-hidden="true">{row.composite_score.toFixed(0)}</span>
          <span className="sr-only">Skor aktivitas {row.composite_score.toFixed(0)} dari 100</span>
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="block truncate text-fluid-00 font-medium text-text-primary">
            {row.region_name}
          </span>
          <span className="block truncate text-fluid-000 text-text-muted">
            Peringkat {row.rank} dari {num(total)} wilayah yang sudah diskor
          </span>
        </span>

        <span className="relative shrink-0 text-fluid-000 font-medium" style={{ color: text }}>
          {riskTierLabel(row.activity_tier)}
        </span>
      </div>

      <div className="mt-2 px-2.5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-earth-border">
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-earth-surface"
            style={{
              left: `${position * 100}%`,
              backgroundColor: fill,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-fluid-000 text-text-muted">
          <span>Paling aktif</span>
          <span>Paling tenang</span>
        </div>
      </div>
    </div>
  );
}

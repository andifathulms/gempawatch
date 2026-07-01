import Link from "next/link";
import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { LeaderboardRow } from "@/lib/types";

// Shareable listicle content ("wilayah paling aktif") + a discovery entry point.
export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-text-muted">Data belum tersedia.</p>;
  }
  return (
    <ol className="divide-y divide-earth-border">
      {rows.map((r) => (
        <li key={r.slug}>
          <Link
            href={`/region/${r.slug}`}
            className="flex items-center gap-3 py-3 hover:opacity-90"
          >
            <span className="w-6 shrink-0 text-center font-mono text-sm text-text-muted">
              {r.rank}
            </span>
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold text-earth-dark"
              style={{ backgroundColor: riskTierColor(r.activity_tier) }}
            >
              {r.composite_score.toFixed(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text-primary">
                {r.region_name}
              </span>
              <span className="block text-xs text-text-muted">
                {r.event_count_m4} gempa M4+ ·{" "}
                {r.largest_magnitude ? `terbesar M${r.largest_magnitude.toFixed(1)}` : "—"}
              </span>
            </span>
            <span
              className="shrink-0 text-xs font-medium"
              style={{ color: riskTierColor(r.activity_tier) }}
            >
              {riskTierLabel(r.activity_tier)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

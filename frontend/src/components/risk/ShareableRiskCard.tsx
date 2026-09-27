import { LogoMark } from "@/components/ui/Logo";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { riskTierTextColor } from "@/lib/seismic";
import { magnitude, num } from "@/lib/format";
import type { RiskCheckReport } from "@/lib/types";

/**
 * The result as a portrait card — designed to survive being screenshotted and
 * reposted without its page (PRD), which is how most people meet it, usually
 * as a WhatsApp Status.
 *
 * That constraint drives the layout: place and score first so any crop still
 * carries the finding; every figure labelled in full; the "historical
 * pattern, not a prediction" line and the sources inside the card, not in
 * page chrome a screenshot would leave behind.
 */
export function ShareableRiskCard({ report }: { report: RiskCheckReport }) {
  const tier = report.activity_tier;
  const region = report.nearest_region;
  const pct = report.activity_percentile;
  const basis = report.activity_percentile_basis?.region_count;

  return (
    <article className="flex aspect-[4/5] w-full max-w-[320px] flex-col gap-3 rounded-xl border border-rule-strong bg-surface p-5 shadow-md">
      <p className="flex items-center gap-2 text-fluid-000 font-bold uppercase tracking-[0.14em] text-ink-3">
        <LogoMark size={16} />
        GempaWatch · Cek Risiko
      </p>
      <p className="text-fluid-2 font-extrabold leading-tight tracking-tight">
        {region?.name ?? "Lokasi pilihanmu"}
      </p>
      <div className="flex items-end gap-3">
        <span
          className="text-[4.5rem] font-extrabold leading-[0.85] tracking-[-0.05em] tabular-nums"
          style={{ color: riskTierTextColor(tier) }}
        >
          {Math.round(report.composite_score)}
        </span>
        <span className="pb-1">
          <RiskTierBadge tier={tier} size="sm" />
        </span>
      </div>
      {pct != null && (
        <p className="text-fluid-00 leading-snug text-ink-2">
          Lebih aktif dari {pct}% {basis ? `dari ${basis} ` : ""}wilayah terskor.
        </p>
      )}
      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-rule pt-3">
        <div>
          <dt className="text-fluid-000 text-ink-3">M4+ dalam 50 km</dt>
          <dd className="text-fluid-2 font-extrabold tabular-nums">
            {num(report.event_count_m4_within_50km)}
          </dd>
        </div>
        <div>
          <dt className="text-fluid-000 text-ink-3">Terbesar</dt>
          <dd className="text-fluid-2 font-extrabold tabular-nums">
            {magnitude(report.largest_magnitude_within_50km)}
          </dd>
        </div>
      </dl>
      <p className="text-fluid-000 leading-snug text-ink-3">
        Pola historis, bukan prediksi. Sumber: BMKG, USGS.
        {report.data_coverage.earliest_year && report.data_coverage.latest_year
          ? ` ${report.data_coverage.earliest_year}–${report.data_coverage.latest_year}.`
          : ""}
      </p>
    </article>
  );
}

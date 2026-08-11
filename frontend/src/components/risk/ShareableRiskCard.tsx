import Link from "next/link";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { RiskScoreGauge } from "@/components/risk/RiskScoreGauge";
import { activityTierMeaning, riskTierColor } from "@/lib/seismic";
import { magnitude, num, regionType } from "@/lib/format";
import type { RiskCheckReport } from "@/lib/types";

/**
 * The result card — designed to survive being screenshotted and reposted
 * without its surrounding page (PRD), which is how most people will meet it.
 *
 * That constraint drives the layout: the gauge and the place name sit at the
 * top so a crop still carries the finding, every figure is labelled in full
 * rather than abbreviated, and the "this is a historical pattern, not a
 * prediction" framing is inside the card rather than in page chrome that a
 * screenshot would leave behind.
 */
export function ShareableRiskCard({ report }: { report: RiskCheckReport }) {
  const tier = report.activity_tier;
  const accent = riskTierColor(tier);
  const region = report.nearest_region;

  return (
    <article
      className="overflow-hidden rounded-2xl border shadow-lg"
      style={{
        borderColor: `${accent}55`,
        background: "linear-gradient(165deg, var(--surface) 0%, var(--earth-dark) 100%)",
      }}
    >
      {/* Tier-coloured rule: the first thing the eye lands on in a screenshot. */}
      <div aria-hidden="true" className="h-1" style={{ backgroundColor: accent }} />

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-fluid-000 uppercase tracking-[0.14em] text-text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-seismic-orange" />
          GempaWatch · Cek Risiko
        </div>

        <h2 className="mt-3 text-fluid-3 font-bold tracking-tight">
          {region?.name ?? "Lokasi pilihanmu"}
        </h2>
        {region && (
          <p className="mt-0.5 text-fluid-000 text-text-muted">
            {regionType(region.type)} terdekat dari titik yang dipilih
          </p>
        )}

        <div className="mt-5 flex justify-center border-y border-earth-border py-5">
          <RiskScoreGauge
            score={report.composite_score}
            tier={tier}
            percentile={report.activity_percentile}
          />
        </div>

        <p className="mt-4 text-fluid-00 leading-relaxed text-text-secondary">
          {activityTierMeaning(tier)}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3">
            <dt className="text-fluid-000 text-text-muted">Gempa M4+ dalam 50 km</dt>
            <dd className="mt-1 font-mono text-fluid-2 font-bold tabular-nums text-text-primary">
              {num(report.event_count_m4_within_50km)}
            </dd>
          </div>
          <div className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3">
            <dt className="text-fluid-000 text-text-muted">Terbesar tercatat</dt>
            <dd className="mt-1 font-mono text-fluid-2 font-bold tabular-nums text-text-primary">
              {magnitude(report.largest_magnitude_within_50km)}
            </dd>
          </div>
          <div className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3">
            <dt className="text-fluid-000 text-text-muted">Sesar aktif terdekat</dt>
            <dd className="mt-1 text-fluid-00 leading-snug text-text-primary">
              {report.nearest_fault ? (
                <>
                  {report.nearest_fault.name}
                  {report.nearest_fault.distance_km != null && (
                    <span className="block font-mono text-fluid-000 tabular-nums text-text-muted">
                      {report.nearest_fault.distance_km.toFixed(0)} km
                    </span>
                  )}
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3">
            <dt className="text-fluid-000 text-text-muted">Risiko tsunami historis</dt>
            <dd className="mt-1.5">
              <RiskTierBadge tier={report.tsunami_risk_tier} size="sm" />
            </dd>
          </div>
        </dl>

        <p className="mt-4 rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3 text-fluid-00 leading-relaxed text-text-secondary">
          {report.comparison.text}
        </p>

        {region && (
          <Link
            href={`/region/${region.slug}`}
            className="mt-4 inline-flex items-center gap-1.5 text-fluid-00 font-medium text-seismic-bright underline underline-offset-2 hover:brightness-110"
          >
            Lihat profil risiko lengkap {region.name} →
          </Link>
        )}

        <p className="mt-5 border-t border-earth-border pt-3.5 text-fluid-000 leading-relaxed text-text-muted">
          {/* methodology_note already carries the not-a-prediction framing —
              only the coverage span is added, never a second disclaimer. */}
          {report.methodology_note}{" "}
          {report.data_coverage.earliest_year && report.data_coverage.latest_year
            ? `Cakupan data ${report.data_coverage.earliest_year}–${report.data_coverage.latest_year}.`
            : ""}
        </p>
      </div>
    </article>
  );
}

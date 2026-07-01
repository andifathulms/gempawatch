import Link from "next/link";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { RiskCheckReport } from "@/lib/types";

// Designed for screenshot / social sharing (PRD). Self-contained, high-contrast.
export function ShareableRiskCard({ report }: { report: RiskCheckReport }) {
  const band = report.overall_risk_band;
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: `${riskTierColor(band)}66`,
        background:
          "linear-gradient(160deg, #232323 0%, #1A1A1A 100%)",
      }}
    >
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-seismic-orange" />
        GEMPAWATCH · Cek Risiko
      </div>

      <h3 className="mt-3 text-xl font-bold">
        {report.nearest_region?.name ?? "Lokasi Anda"}
      </h3>

      <div className="mt-4 flex items-baseline gap-3">
        <span
          className="font-mono text-4xl font-bold"
          style={{ color: riskTierColor(band) }}
        >
          {riskTierLabel(band)}
        </span>
        <span className="text-sm text-text-secondary">risiko historis</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-text-muted">Gempa M4+ (50km)</dt>
          <dd className="font-mono text-lg">{report.event_count_m4_within_50km}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Terbesar tercatat</dt>
          <dd className="font-mono text-lg">
            {report.largest_magnitude_within_50km
              ? `M${report.largest_magnitude_within_50km.toFixed(1)}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Sesar terdekat</dt>
          <dd className="text-sm">
            {report.nearest_fault
              ? `${report.nearest_fault.name}${
                  report.nearest_fault.distance_km != null
                    ? ` · ${report.nearest_fault.distance_km.toFixed(0)} km`
                    : ""
                }`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Risiko tsunami</dt>
          <dd>
            <RiskTierBadge tier={report.tsunami_risk_tier} />
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-text-secondary">{report.comparison.text}</p>

      {report.nearest_region && (
        <Link
          href={`/region/${report.nearest_region.slug}`}
          className="mt-3 inline-block text-sm text-seismic-orange underline underline-offset-2 hover:brightness-110"
        >
          Lihat profil risiko lengkap {report.nearest_region.name} →
        </Link>
      )}

      <p className="mt-4 border-t border-earth-border pt-3 text-[11px] leading-relaxed text-text-muted">
        {report.methodology_note}
      </p>
    </div>
  );
}

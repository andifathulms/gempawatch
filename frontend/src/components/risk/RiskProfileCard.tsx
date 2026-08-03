import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { RiskScoreGauge } from "@/components/risk/RiskScoreGauge";
import { activityTierMeaning } from "@/lib/seismic";
import { depth, magnitude, num } from "@/lib/format";
import type { RegionRiskProfile } from "@/lib/types";

/**
 * A region's summary panel: the score up top, then the figures behind it.
 *
 * The gauge is followed immediately by a plain sentence saying what the tier
 * means, so nobody has to infer it from a colour — and so the framing stays
 * "historical pattern" rather than "warning".
 */
export function RiskProfileCard({ profile }: { profile: RegionRiskProfile }) {
  const p = profile;
  const coverage =
    p.earliest_event_year && p.latest_event_year
      ? `${p.earliest_event_year}–${p.latest_event_year}`
      : "—";

  return (
    <Card title="Ringkasan risiko">
      <div className="flex justify-center border-b border-earth-border pb-5">
        <RiskScoreGauge
          score={p.composite_score}
          tier={p.activity_tier}
          percentile={p.activity_percentile}
        />
      </div>

      <p className="py-4 text-sm leading-relaxed text-text-secondary">
        {activityTierMeaning(p.activity_tier)}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <RiskTierBadge tier={p.tsunami_risk_tier} label="Risiko tsunami" />
        {p.region.is_coastal && (
          <span className="rounded-full border border-earth-border px-2.5 py-1 text-xs text-text-muted">
            Wilayah pesisir
          </span>
        )}
      </div>

      <Stat
        label="Gempa M4+ (radius 100 km)"
        value={num(p.event_count_m4)}
        accent
        hint="Seluruh kejadian M4.0 ke atas dalam radius 100 km dari titik pusat wilayah, sepanjang catatan."
      />
      <Stat label="Gempa M5+" value={num(p.event_count_m5)} />
      <Stat label="Gempa M6+" value={num(p.event_count_m6)} />
      <Stat label="Gempa M7+" value={num(p.event_count_m7_plus)} />
      <Stat label="Magnitudo terbesar" value={magnitude(p.largest_magnitude)} />
      <Stat
        label="Kedalaman rata-rata"
        value={depth(p.avg_depth_km)}
        hint="Gempa dangkal (<70 km) umumnya lebih terasa dan lebih merusak di permukaan."
      />
      <Stat label="Sesar aktif terdekat" value={p.nearest_fault_name ?? "—"} />
      <Stat
        label="Jarak ke sesar"
        value={
          p.nearest_fault_distance_km != null
            ? `${p.nearest_fault_distance_km.toFixed(0)}`
            : "—"
        }
        unit={p.nearest_fault_distance_km != null ? "km" : undefined}
      />

      <p className="mt-4 border-t border-earth-border pt-3.5 text-[11px] leading-relaxed text-text-muted">
        Data historis {coverage}. Jumlah kejadian dihitung dalam radius tetap 100 km
        dan <em>tidak</em> dinormalisasi terhadap luas wilayah maupun populasi —
        gunakan persentil untuk perbandingan relatif. Indikator pola historis, bukan
        prediksi.
      </p>
    </Card>
  );
}

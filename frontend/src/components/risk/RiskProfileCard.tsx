import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import type { RegionRiskProfile } from "@/lib/types";

export function RiskProfileCard({ profile }: { profile: RegionRiskProfile }) {
  const p = profile;
  return (
    <Card title="Ringkasan Risiko">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RiskTierBadge tier={p.tsunami_risk_tier} label="Risiko Tsunami" />
        {p.region.is_coastal && (
          <span className="text-xs text-text-muted">Wilayah pesisir</span>
        )}
      </div>
      <Stat label="Gempa M4+ (radius 100km)" value={p.event_count_m4} accent />
      <Stat label="Gempa M5+" value={p.event_count_m5} />
      <Stat label="Gempa M6+" value={p.event_count_m6} />
      <Stat label="Gempa M7+" value={p.event_count_m7_plus} />
      <Stat
        label="Magnitudo terbesar"
        value={p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—"}
      />
      <Stat
        label="Kedalaman rata-rata"
        value={p.avg_depth_km ? `${p.avg_depth_km.toFixed(0)} km` : "—"}
      />
      <Stat
        label="Sesar terdekat"
        value={p.nearest_fault_name ?? "—"}
      />
      <Stat
        label="Jarak ke sesar"
        value={
          p.nearest_fault_distance_km != null
            ? `${p.nearest_fault_distance_km.toFixed(0)} km`
            : "—"
        }
      />
    </Card>
  );
}

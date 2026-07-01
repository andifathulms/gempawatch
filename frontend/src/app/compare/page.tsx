import Link from "next/link";
import { api } from "@/lib/api";
import type { RegionRiskProfile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { CompareSelector } from "@/components/discover/CompareSelector";
import { RiskScoreGauge } from "@/components/risk/RiskScoreGauge";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

export const revalidate = 3600;

export const metadata = {
  title: "Bandingkan Wilayah — GempaWatch",
  description: "Bandingkan profil risiko gempa dua kota/kabupaten berdampingan.",
};

const ROWS: Array<{ label: string; get: (p: RegionRiskProfile) => string }> = [
  { label: "Skor aktivitas", get: (p) => (p.composite_score?.toFixed(0) ?? "—") + "/100" },
  { label: "Persentil", get: (p) => (p.activity_percentile != null ? `${p.activity_percentile}%` : "—") },
  { label: "Gempa M4+", get: (p) => String(p.event_count_m4) },
  { label: "Gempa M5+", get: (p) => String(p.event_count_m5) },
  { label: "Gempa M6+", get: (p) => String(p.event_count_m6) },
  { label: "Terbesar", get: (p) => (p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—") },
  { label: "Kedalaman rata²", get: (p) => (p.avg_depth_km ? `${p.avg_depth_km.toFixed(0)} km` : "—") },
  { label: "Sesar terdekat", get: (p) => p.nearest_fault_name ?? "—" },
  {
    label: "Jarak sesar",
    get: (p) => (p.nearest_fault_distance_km != null ? `${p.nearest_fault_distance_km.toFixed(0)} km` : "—"),
  },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string };
}) {
  const options = (await api.leaderboard(50, "desc").then((r) => r.results).catch(() => []))
    .map((r) => ({ slug: r.slug, name: r.region_name }))
    .sort((x, y) => x.name.localeCompare(y.name));

  const { a, b } = searchParams;
  let profiles: RegionRiskProfile[] = [];
  if (a && b) {
    profiles = await api.compareRegions([a, b]).catch(() => []);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bandingkan Wilayah"
        subtitle="Lihat dua profil risiko berdampingan. Persentil memberi konteks relatif nasional."
      />

      <Card>
        <CompareSelector options={options} initialA={a} initialB={b} />
      </Card>

      {profiles.length === 2 && (
        <Card>
          <div className="grid grid-cols-2 gap-4">
            {profiles.map((p) => (
              <div key={p.region.slug} className="flex flex-col items-center gap-2">
                <Link
                  href={`/region/${p.region.slug}`}
                  className="text-center text-sm font-semibold text-text-primary hover:text-seismic-orange"
                >
                  {p.region.name}
                </Link>
                <RiskScoreGauge
                  score={p.composite_score}
                  tier={p.activity_tier}
                  percentile={p.activity_percentile}
                  size={140}
                />
                <RiskTierBadge tier={p.tsunami_risk_tier} label="Tsunami" />
              </div>
            ))}
          </div>

          <table className="mt-6 w-full text-sm">
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-earth-border">
                  <td className="py-2 pr-2 text-right font-mono text-text-primary">
                    {row.get(profiles[0])}
                  </td>
                  <td className="w-1/3 py-2 text-center text-xs text-text-muted">
                    {row.label}
                  </td>
                  <td className="py-2 pl-2 font-mono text-text-primary">
                    {row.get(profiles[1])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {a && b && profiles.length !== 2 && (
        <p className="text-sm text-text-muted">
          Salah satu wilayah tidak ditemukan. Pilih ulang di atas.
        </p>
      )}

      <SourceAttribution />
    </div>
  );
}

import { api } from "@/lib/api";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Laporan risiko gempa — GempaWatch";

export default async function OgImage({
  params,
}: {
  params: { lat: string; lng: string };
}) {
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  try {
    const r = await api.riskCheck(lat, lng);
    const pct = r.activity_percentile;
    return renderOgCard({
      kicker: "Cek Risiko",
      title: r.nearest_region?.name ?? "Lokasi Anda",
      scoreLabel: r.composite_score.toFixed(0),
      tier: r.activity_tier,
      percentileText: pct != null ? `Lebih aktif dari ${pct}% wilayah` : undefined,
      stats: [
        { label: "Gempa M4+ (50km)", value: String(r.event_count_m4_within_50km) },
        {
          label: "Terbesar",
          value: r.largest_magnitude_within_50km
            ? `M${r.largest_magnitude_within_50km.toFixed(1)}`
            : "—",
        },
        {
          label: "Tsunami",
          value: r.tsunami_risk_tier ?? "—",
        },
      ],
    });
  } catch {
    return renderOgCard({
      kicker: "Cek Risiko",
      title: "GempaWatch",
      scoreLabel: "—",
      tier: null,
      stats: [],
    });
  }
}

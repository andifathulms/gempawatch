import { api } from "@/lib/api";
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Profil risiko gempa wilayah — GempaWatch";

// Dynamic OG image so a pasted region link unfurls into the risk card in
// WhatsApp / X / Telegram — the core distribution loop.
export default async function OgImage({ params }: { params: { slug: string } }) {
  try {
    const p = await api.riskProfile(params.slug);
    const pct = p.activity_percentile;
    return renderOgCard({
      kicker: p.region.type,
      title: p.region.name,
      scoreLabel: p.composite_score != null ? p.composite_score.toFixed(0) : "—",
      tier: p.activity_tier,
      percentileText:
        pct != null ? `Lebih aktif dari ${pct}% wilayah` : undefined,
      stats: [
        { label: "Gempa M4+", value: String(p.event_count_m4) },
        {
          label: "Terbesar",
          value: p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—",
        },
        { label: "Sesar terdekat", value: p.nearest_fault_name ?? "—" },
      ],
    });
  } catch {
    return renderOgCard({
      kicker: "Wilayah",
      title: "GempaWatch",
      scoreLabel: "—",
      tier: null,
      stats: [],
    });
  }
}

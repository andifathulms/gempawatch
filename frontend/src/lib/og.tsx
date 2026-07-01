import { ImageResponse } from "next/og";
import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface CardData {
  kicker: string;
  title: string;
  scoreLabel: string; // big value, e.g. "89.7" or "Tinggi"
  tier: RiskTier | null;
  percentileText?: string;
  stats: Array<{ label: string; value: string }>;
}

// Shared OG card renderer for region + risk-result share images.
// next/og supports a flexbox subset — every multi-child node needs display:flex.
export function renderOgCard(data: CardData): ImageResponse {
  const accent = riskTierColor(data.tier);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #232323 0%, #1A1A1A 100%)",
          padding: 64,
          fontFamily: "sans-serif",
          color: "#F2EDE4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              background: "#E8743B",
            }}
          />
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, color: "#A8A39A" }}>
            GEMPAWATCH
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#A8A39A" }}>{data.kicker}</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700 }}>{data.title}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: 12 }}>
            <div style={{ display: "flex", fontSize: 120, fontWeight: 700, color: accent, lineHeight: 1 }}>
              {data.scoreLabel}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 14 }}>
              <div style={{ display: "flex", fontSize: 34, color: accent, fontWeight: 600 }}>
                Risiko {riskTierLabel(data.tier)}
              </div>
              {data.percentileText ? (
                <div style={{ display: "flex", fontSize: 26, color: "#A8A39A" }}>
                  {data.percentileText}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 48 }}>
          {data.stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 24, color: "#6B6660" }}>{s.label}</div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 600 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#6B6660" }}>
          Indikator pola historis · Data: BMKG & USGS · Bukan peringatan dini
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

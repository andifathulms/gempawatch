import { ImageResponse } from "next/og";
import { riskTierColor, riskTierTextColor, riskTierLabel } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Palette literals.
 *
 * next/og rasterises this at request time in an isolated renderer with no
 * stylesheet and no CSS custom properties, so the tokens cannot be referenced
 * here. These are the only other place besides global-error.tsx where palette
 * values are duplicated; both are labelled with the token they mirror so a
 * palette change has a findable checklist.
 */
const INK = "#121110"; // --earth-dark
const SURFACE = "#1C1A18"; // --surface
const BORDER = "#33302B"; // --border
const TEXT = "#F5F1EA"; // --text-primary
const TEXT_2 = "#B8B1A6"; // --text-secondary
const TEXT_3 = "#948C81"; // --text-muted
const ORANGE = "#E8743B"; // --seismic-orange

interface CardData {
  kicker: string;
  title: string;
  scoreLabel: string; // big value, e.g. "89" or "Tinggi"
  tier: RiskTier | null;
  percentileText?: string;
  stats: Array<{ label: string; value: string }>;
}

/**
 * Shared OG card renderer for region + risk-result share images.
 *
 * This is the version of the product most people meet first — it is what
 * unfurls in a WhatsApp thread — so it follows the same rules as the in-page
 * result card: the tier rule across the top, the finding stated before the
 * supporting figures, and the not-a-warning framing inside the image rather
 * than in link text that a forward would drop.
 *
 * next/og supports a flexbox subset — every multi-child node needs display:flex.
 */
export function renderOgCard(data: CardData): ImageResponse {
  const accent = riskTierColor(data.tier);
  const accentText = riskTierTextColor(data.tier);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: SURFACE,
          fontFamily: "sans-serif",
          color: TEXT,
        }}
      >
        {/* Tier rule — the first thing the eye lands on in a feed. */}
        <div style={{ display: "flex", height: 10, background: accent }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: 60,
            background: `linear-gradient(160deg, ${SURFACE} 0%, ${INK} 100%)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{ width: 20, height: 20, borderRadius: 999, background: ORANGE }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 26,
                letterSpacing: 3,
                color: TEXT_3,
              }}
            >
              GEMPAWATCH
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", fontSize: 28, color: TEXT_2 }}>
              {data.kicker}
            </div>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 700 }}>
              {data.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 22,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 118,
                  fontWeight: 700,
                  color: accentText,
                  lineHeight: 1,
                }}
              >
                {data.scoreLabel}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", marginBottom: 14 }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 32,
                    color: accentText,
                    fontWeight: 600,
                  }}
                >
                  Aktivitas {riskTierLabel(data.tier)}
                </div>
                {data.percentileText ? (
                  <div style={{ display: "flex", fontSize: 25, color: TEXT_2 }}>
                    {data.percentileText}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {data.stats.map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", fontSize: 22, color: TEXT_3 }}>
                  {s.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 38,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", fontSize: 21, color: TEXT_3 }}>
            Indikator pola historis · Data: BMKG &amp; USGS · Bukan peringatan dini
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

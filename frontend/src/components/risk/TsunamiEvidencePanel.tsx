import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { num } from "@/lib/format";
import type { TsunamiEvidence } from "@/lib/types";

/**
 * How the tsunami tier was reached, next to the tier.
 *
 * The tier used to be a single word. The count behind it was computed in the
 * engine, compared against the thresholds, and discarded — so the app's
 * second headline output was a verdict with its evidence deleted, on the card
 * most likely to be forwarded to someone who never visits the site.
 *
 * Three things are stated here because all three are load-bearing and all three
 * lived on the methodology page instead:
 *
 *  - the count, so the verdict is checkable;
 *  - the rule it was tested against, at the point it is applied;
 *  - that "coastal" is a precomputed proxy for an offshore epicentre rather
 *    than real coastline geometry, which is the largest simplification in the
 *    whole classification.
 */
export function TsunamiEvidencePanel({ evidence }: { evidence: TsunamiEvidence }) {
  const { criteria: c, qualifying_events: n, is_coastal, tier } = evidence;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <RiskTierBadge tier={tier} label="Risiko tsunami historis" />
        {!is_coastal && (
          <span className="text-fluid-00 text-text-secondary">
            Titik ini tidak ditandai pesisir, jadi tidak diberi tingkat.
          </span>
        )}
      </div>

      {is_coastal && (
        <>
          {/* The arithmetic, in the order the rule applies it. */}
          <p className="text-fluid-00 leading-relaxed text-text-secondary">
            <span className="font-mono font-bold tabular-nums text-text-primary">
              {num(n)}
            </span>{" "}
            gempa dalam catatan memenuhi ketiga syarat sekaligus — magnitudo{" "}
            <span className="font-mono tabular-nums text-text-primary">
              ≥{c.min_magnitude.toLocaleString("id-ID")}
            </span>
            , kedalaman{" "}
            <span className="font-mono tabular-nums text-text-primary">
              &lt;{num(c.max_depth_km)} km
            </span>
            , dan berjarak{" "}
            <span className="font-mono tabular-nums text-text-primary">
              ≤{num(c.search_radius_km)} km
            </span>{" "}
            dari titik ini.
          </p>

          <ul className="space-y-1.5 text-fluid-00">
            {[
              {
                label: "Tinggi",
                tier: "HIGH",
                min: c.high_threshold,
                tone: "text-risk-red",
              },
              {
                label: "Sedang",
                tier: "MODERATE",
                min: c.moderate_threshold,
                tone: "text-risk-amber",
              },
              { label: "Rendah", tier: "LOW", min: 0, tone: "text-risk-green" },
            ].map((band) => {
              // The engine already decided; re-deriving it here would be a
              // second implementation of the same rule, free to disagree.
              const active = band.tier === tier;
              return (
                <li
                  key={band.label}
                  className={`flex items-baseline gap-2.5 rounded-md px-2 py-1 ${
                    active ? "bg-earth-dark/60" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={active ? "text-seismic-bright" : "text-transparent"}
                  >
                    →
                  </span>
                  <span className={active ? "text-text-primary" : "text-text-muted"}>
                    <strong className={`font-semibold ${band.tone}`}>
                      {band.label}
                    </strong>{" "}
                    ={" "}
                    {band.min === 0
                      ? "tidak ada kejadian yang memenuhi"
                      : band.min === c.high_threshold
                        ? `${num(band.min)} kejadian atau lebih`
                        : `${num(band.min)}–${num(c.high_threshold - 1)} kejadian`}
                    {active && (
                      <span className="text-text-secondary">
                        {" "}
                        — ini yang berlaku di sini
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* The simplification, admitted where the verdict is, not on another page. */}
      <p className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3 text-fluid-000 leading-relaxed text-text-muted">
        <strong className="font-semibold text-text-secondary">
          Yang disederhanakan:
        </strong>{" "}
        status &ldquo;pesisir&rdquo; adalah penanda yang kami hitung sebelumnya
        sebagai pendekatan untuk episentrum di lepas pantai — bukan pengukuran
        garis pantai yang presisi. Ambang batas di atas kami tetapkan sendiri
        dari pola kejadian historis; ini bukan kriteria resmi BMKG maupun
        standar internasional, dan{" "}
        <strong className="font-semibold text-text-secondary">
          bukan peringatan dini
        </strong>
        .
      </p>
    </div>
  );
}

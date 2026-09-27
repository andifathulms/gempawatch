import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { RegionDotPlot } from "@/components/risk/RegionDotPlot";
import { riskTierTextColor } from "@/lib/seismic";
import type { RiskTier } from "@/lib/types";

interface Props {
  eyebrow: string;
  place: string;
  /** Small line under the place: coordinates, or region type and island. */
  meta?: React.ReactNode;
  score: number;
  tier: RiskTier | null;
  /** The finding in prose — the record, past tense, never a forecast. */
  finding: React.ReactNode;
  /** Dot-plot label and, for a scored region, the dot to ring. */
  plotLabel: string;
  plotSlug?: string;
  /** h1 on a standalone page; h2 when the page already has its question as h1. */
  headingLevel?: 1 | 2;
  /** Follows the finding — the share row on region pages. */
  action?: React.ReactNode;
}

/**
 * The answer, as one band: place, score, tier and the finding on the left;
 * where the score sits among every scored region on the right.
 *
 * Shared by the point result and the region page so the two answers read
 * identically. The score numeral is the only large coloured type on the site —
 * tier colour, because the tier is what it states.
 */
export function VerdictBand({
  eyebrow,
  place,
  meta,
  score,
  tier,
  finding,
  plotLabel,
  plotSlug,
  headingLevel = 2,
  action,
}: Props) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      <div className="min-w-0">
        <p className="text-fluid-000 font-bold uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>
        <Heading className="mt-2 text-fluid-5 font-extrabold tracking-tight">{place}</Heading>
        {meta && <p className="mt-1.5 text-fluid-00 text-ink-3">{meta}</p>}

        <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-3">
          <p
            className="text-fluid-6 font-extrabold tabular-nums tracking-[-0.05em]"
            style={{ color: riskTierTextColor(tier) }}
          >
            {Math.round(score)}
            <span className="ml-1 text-fluid-2 font-semibold tracking-normal text-ink-3">/100</span>
          </p>
          <div className="grid gap-1.5 pb-2">
            <RiskTierBadge tier={tier} label="Aktivitas" />
            <span className="text-fluid-000 text-ink-3">Skor aktivitas historis</span>
          </div>
        </div>

        <p className="mt-5 max-w-[46ch] text-fluid-1 leading-relaxed text-ink">{finding}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-fluid-00 font-semibold text-ink-2">Di antara wilayah yang sudah diskor</p>
        <RegionDotPlot score={score} label={plotLabel} slug={plotSlug} />
      </div>
    </section>
  );
}

export interface Fact {
  value: React.ReactNode;
  label: React.ReactNode;
}

/**
 * Four figures in one ruled row, replacing four bordered tiles. The rules do
 * the separating; boxes only added weight. Two columns on phones.
 */
export function FactRow({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-2 border-y border-rule lg:grid-cols-4">
      {facts.map((f, i) => (
        <div
          key={i}
          className={[
            "grid content-start gap-1 py-4",
            i % 2 === 1 ? "border-l border-rule pl-4" : "pr-4",
            i >= 2 ? "border-t border-rule lg:border-t-0" : "",
            i === 2 ? "lg:border-l lg:pl-4" : "",
          ].join(" ")}
        >
          <dd className="order-1 text-fluid-3 font-extrabold tabular-nums tracking-tight text-ink">{f.value}</dd>
          <dt className="order-2 text-fluid-00 leading-snug text-ink-2">{f.label}</dt>
        </div>
      ))}
    </dl>
  );
}

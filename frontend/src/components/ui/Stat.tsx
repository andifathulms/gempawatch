interface Props {
  label: string;
  value: string | number;
  /** Small trailing unit, set apart from the figure ("km", "/100", "kejadian"). */
  unit?: string;
  accent?: boolean;
  /** Explanatory note shown on hover/focus — for figures with a caveat. */
  hint?: string;
}

/**
 * Label-left / figure-right row, for dense summary lists.
 *
 * The figure is mono with tabular numerals so a stack of these aligns on the
 * decimal point; scanning a column of magnitudes is the main thing readers do
 * with them. Rows are `<div>`s rather than `<dl>` pairs so callers can compose
 * them freely — the semantic grouping lives in the containing Card's title.
 */
export function Stat({ label, value, unit, accent, hint }: Props) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-earth-border/60 py-2.5 last:border-b-0">
      {/* Same reasoning as StatTile: a `title` tooltip is invisible on touch,
          so a caveat parked in one reaches nobody who needs it. */}
      <span className="min-w-0">
        <span className="text-fluid-00 text-text-secondary">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-fluid-000 leading-snug text-text-muted">
            {hint}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-baseline gap-1">
        <span
          className={`font-mono text-fluid-1 font-medium tabular-nums ${accent ? "text-seismic-bright" : "text-text-primary"}`}
        >
          {value}
        </span>
        {unit && <span className="text-fluid-000 text-text-muted">{unit}</span>}
      </span>
    </div>
  );
}

interface TileProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Colours the figure — use sparingly, for the one number that matters most. */
  tone?: "default" | "accent" | "danger";
  hint?: string;
}

/**
 * Figure-first tile, for the headline numbers at the top of a page.
 *
 * Inverts the row: the figure leads at display size and the label explains it
 * underneath. Use four or fewer per row — past that they stop being headlines.
 *
 * The label is the tile's *whole point* and used to be set in the smallest,
 * dimmest combination on the site (12px muted), which made the four figures on
 * the homepage into big numbers nobody could name. It now sits at --step-00 in
 * the secondary tone: still clearly subordinate to the figure, but readable at
 * a glance, which is the only way a headline number means anything.
 *
 * `hint` renders as visible text rather than a `title` tooltip. A native
 * tooltip never appears on touch, which is most of this audience, and it is not
 * reliably announced by screen readers — so the caveat was invisible to exactly
 * the people it protects. These hints are not decoration: on the timeline one
 * of them is the difference between "Indonesia's earthquake death toll" and
 * "the sum of the rows in this archive".
 */
export function StatTile({ label, value, unit, tone = "default", hint }: TileProps) {
  const color =
    tone === "accent"
      ? "text-seismic-bright"
      : tone === "danger"
        ? "text-risk-red"
        : "text-text-primary";
  return (
    <div className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3">
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-fluid-2 font-bold tabular-nums ${color}`}>
          {value}
        </span>
        {unit && <span className="text-fluid-000 text-text-muted">{unit}</span>}
      </div>
      <p className="mt-1.5 text-fluid-00 leading-snug text-text-secondary">{label}</p>
      {hint && (
        <p className="mt-1.5 text-fluid-000 leading-snug text-text-muted">{hint}</p>
      )}
    </div>
  );
}

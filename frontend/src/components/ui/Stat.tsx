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
      <span
        className={`text-sm text-text-secondary ${hint ? "cursor-help decoration-dotted underline-offset-4 hover:underline" : ""}`}
        title={hint}
      >
        {label}
      </span>
      <span className="flex shrink-0 items-baseline gap-1">
        <span
          className={`font-mono text-lg font-medium tabular-nums ${accent ? "text-seismic-bright" : "text-text-primary"}`}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
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
 */
export function StatTile({ label, value, unit, tone = "default", hint }: TileProps) {
  const color =
    tone === "accent"
      ? "text-seismic-bright"
      : tone === "danger"
        ? "text-risk-red"
        : "text-text-primary";
  return (
    <div
      className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3"
      title={hint}
    >
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-bold tabular-nums ${color}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-text-muted">{unit}</span>}
      </div>
      <p className="mt-1 text-xs leading-snug text-text-muted">{label}</p>
    </div>
  );
}

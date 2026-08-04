interface MarkProps {
  size?: number;
  className?: string;
}

/**
 * The GempaWatch mark: a seismograph trace over epicentre rings.
 *
 * Inlined rather than loaded from /brand/icon.svg so it costs no request, can
 * inherit the page palette, and stays crisp at any size. Two deliberate
 * departures from the exported asset:
 *
 * - No tile. The export carries its own #1a1a1a rounded square, which would
 *   read as a slightly-wrong charcoal patch against our --earth-dark header.
 *   On-site the glyph sits directly on the page.
 * - Higher ring opacities. The export's 0.25/0.4/0.55 were tuned for a 512px
 *   app icon; at the 30px the header renders, those strokes disappear and the
 *   mark collapses to a bare squiggle.
 *
 * The palette is the site's own tokens, so the mark's orange matches the
 * wordmark beside it exactly (the export sits a hair off at #e8722e).
 */
export function LogoMark({ size = 30, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 98 98"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="49"
        cy="49"
        r="44"
        stroke="var(--seismic-orange)"
        strokeWidth="3"
        opacity="0.45"
      />
      <circle
        cx="49"
        cy="49"
        r="32"
        stroke="var(--seismic-orange)"
        strokeWidth="3"
        opacity="0.65"
      />
      <circle
        cx="49"
        cy="49"
        r="20"
        stroke="var(--seismic-orange)"
        strokeWidth="3"
        opacity="0.85"
      />
      <polyline
        points="8,49 24,49 30,32 38,66 46,20 54,78 62,49 90,49"
        stroke="var(--text-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="49" cy="49" r="6" fill="var(--seismic-orange)" />
    </svg>
  );
}

interface LogoProps {
  /** Pixel size of the mark; the wordmark scales alongside it. */
  size?: number;
  /** Hides the wordmark, leaving the mark alone. */
  markOnly?: boolean;
  className?: string;
}

/** Mark + wordmark lockup, as used in the header and footer. */
export function Logo({ size = 30, markOnly, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      {!markOnly && (
        <span className="font-display font-bold tracking-tight text-text-primary">
          GEMPA<span className="text-seismic-orange">WATCH</span>
        </span>
      )}
    </span>
  );
}

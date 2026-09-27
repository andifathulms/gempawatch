interface MarkProps {
  size?: number;
  className?: string;
}

/**
 * The GempaWatch mark: a seismograph trace over epicentre rings.
 *
 * Ink, like the rest of the chrome, with one exception — the epicentre dot is
 * the shallow-depth fill. That is the only brand colour on the site and it
 * still obeys the palette rule (colour is data): it marks a shallow epicentre.
 *
 * Inlined rather than loaded from /brand/icon.svg so it costs no request,
 * follows the Kertas/Malam tokens, and stays crisp at header size (the rings
 * are heavier than the exported 512px asset's, which vanish at 28px).
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
      <circle cx="49" cy="49" r="44" stroke="var(--ink)" strokeWidth="4" opacity="0.22" />
      <circle cx="49" cy="49" r="30" stroke="var(--ink)" strokeWidth="4" opacity="0.42" />
      <polyline
        points="8,49 24,49 30,32 38,66 46,20 54,78 62,49 90,49"
        stroke="var(--ink)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="49" cy="49" r="8" fill="var(--depth-shallow-fill)" />
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
        <span className="font-extrabold tracking-tight text-ink">GempaWatch</span>
      )}
    </span>
  );
}

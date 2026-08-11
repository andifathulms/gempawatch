import type { Source } from "@/lib/types";

interface Props {
  /** Which sources are represented in the displayed data. Defaults to both. */
  sources?: Source[];
  /** `inline` fits a map popup or a card footer; `block` stands on its own. */
  variant?: "block" | "inline";
  className?: string;
}

/**
 * MANDATORY component — must appear on every page/card showing earthquake data.
 * BMKG attribution is a legal requirement, never strip or hide it (see CLAUDE.md).
 *
 * Legibility is part of that obligation, and colour alone was not discharging
 * it: the muted tone clears WCAG AA, but the inline variant was rendering at
 * 11px, which is technically present and practically fine print. Both variants
 * now sit at --step-000, the floor for the whole site.
 */
const LABELS: Record<Source, { short: string; text: string; href: string }> = {
  BMKG: {
    short: "BMKG",
    text: "Sumber: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)",
    href: "https://www.bmkg.go.id/",
  },
  USGS: {
    short: "USGS",
    text: "Data: United States Geological Survey (USGS)",
    href: "https://earthquake.usgs.gov/",
  },
};

export function SourceAttribution({
  sources = ["BMKG", "USGS"],
  variant = "block",
  className,
}: Props) {
  if (variant === "inline") {
    return (
      <p className={`text-fluid-000 leading-relaxed text-text-muted ${className ?? ""}`}>
        Sumber data:{" "}
        {sources.map((s, i) => (
          <span key={s}>
            {i > 0 && " · "}
            <a
              href={LABELS[s].href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-text-secondary"
            >
              {LABELS[s].short}
            </a>
          </span>
        ))}
      </p>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-fluid-000 text-text-muted ${className ?? ""}`}
    >
      {sources.map((s) => (
        <a
          key={s}
          href={LABELS[s].href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 underline decoration-earth-border-strong underline-offset-2 transition-colors hover:text-text-secondary hover:decoration-text-muted"
        >
          <span
            aria-hidden="true"
            className="h-1 w-1 rounded-full bg-text-muted"
          />
          {LABELS[s].text}
        </a>
      ))}
    </div>
  );
}

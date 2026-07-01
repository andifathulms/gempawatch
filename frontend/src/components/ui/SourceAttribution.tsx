import type { Source } from "@/lib/types";

interface Props {
  /** Which sources are represented in the displayed data. Defaults to both. */
  sources?: Source[];
  className?: string;
}

// MANDATORY component — must appear on every page/card showing earthquake data.
// BMKG attribution is a legal requirement, never strip or hide it (see CLAUDE.md).
const LABELS: Record<Source, { text: string; href: string }> = {
  BMKG: {
    text: "Sumber: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)",
    href: "https://www.bmkg.go.id/",
  },
  USGS: {
    text: "Data: United States Geological Survey (USGS)",
    href: "https://earthquake.usgs.gov/",
  },
};

export function SourceAttribution({ sources = ["BMKG", "USGS"], className }: Props) {
  return (
    <div className={`text-xs text-text-muted space-y-0.5 ${className ?? ""}`}>
      {sources.map((s) => (
        <p key={s}>
          <a
            href={LABELS[s].href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary underline underline-offset-2"
          >
            {LABELS[s].text}
          </a>
        </p>
      ))}
    </div>
  );
}

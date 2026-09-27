import type { HistoricalDisaster } from "@/lib/types";
import type { DisasterFragment } from "@/lib/seismogram";
import { DisasterEntry } from "./DisasterEntry";
import { EmptyState } from "@/components/ui/EmptyState";

export type { DisasterFragment };

/**
 * Vertical timeline — the shareable, educational, commemorative layer.
 *
 * Entries are grouped by decade with a sticky heading. A flat list of a dozen
 * dated cards reads as a feed; decade markers turn it into a chronology, so
 * the twelve-year gap between Aceh 2004 and the next entry is something the
 * reader can see rather than compute from datelines.
 */
function decadeOf(iso: string): number {
  return Math.floor(new Date(iso).getFullYear() / 10) * 10;
}

interface Props {
  disasters: HistoricalDisaster[];
  /** Keyed by disaster id; missing or null just means no fragment renders for that entry. */
  fragments?: Record<number, DisasterFragment | null>;
}

export function DisasterTimeline({ disasters, fragments = {} }: Props) {
  if (disasters.length === 0) {
    return (
      <EmptyState
        title="Arsip bencana historis belum tersedia."
        description="Data dimuat dari kurasi kejadian besar; coba muat ulang halaman."
      />
    );
  }

  // Newest first — the archive is read as "what has happened", starting from
  // living memory and going back.
  const ordered = [...disasters].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
  );

  const groups: { decade: number; items: HistoricalDisaster[] }[] = [];
  for (const d of ordered) {
    const decade = decadeOf(d.event_date);
    const last = groups[groups.length - 1];
    if (last && last.decade === decade) last.items.push(d);
    else groups.push({ decade, items: [d] });
  }

  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.decade}>
          <h2 className="sticky top-[57px] z-10 -mx-4 mb-0 bg-paper/90 px-4 py-2 text-fluid-2 font-extrabold tabular-nums tracking-tight text-ink backdrop-blur sm:mx-0 sm:px-0">
            {g.decade}s
          </h2>
          <div>
            {g.items.map((d) => (
              <DisasterEntry key={d.id} disaster={d} fragment={fragments[d.id] ?? null} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

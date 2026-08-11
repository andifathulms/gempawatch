import type { HistoricalDisaster } from "@/lib/types";
import { DisasterEntry } from "./DisasterEntry";
import { EmptyState } from "@/components/ui/EmptyState";

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

export function DisasterTimeline({ disasters }: { disasters: HistoricalDisaster[] }) {
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
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.decade}>
          <h2 className="sticky top-16 z-10 -mx-1 mb-4 w-fit rounded-full border border-earth-border bg-earth-dark/90 px-3.5 py-1 font-mono text-fluid-00 font-bold tabular-nums text-seismic-orange backdrop-blur">
            {g.decade}s
          </h2>
          {/* No left padding: the dot centres on the article edge, so any
              padding here slides every dot off the rail it marks. */}
          <div className="relative space-y-5 border-l border-earth-border">
            {g.items.map((d) => (
              <DisasterEntry key={d.id} disaster={d} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

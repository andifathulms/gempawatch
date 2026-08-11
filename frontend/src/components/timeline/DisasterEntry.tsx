import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { num } from "@/lib/format";
import type { HistoricalDisaster } from "@/lib/types";

/**
 * One entry in the disaster archive.
 *
 * Entries with mass casualties carry more visual weight — a larger title, a
 * red node, a hairline ring. The restraint is deliberate: these are real death
 * tolls, and the design's job is to make the scale legible without turning
 * grief into an alarm graphic.
 */
function isMajor(casualties: number | null): boolean {
  return (casualties ?? 0) >= 5000;
}

export function DisasterEntry({ disaster }: { disaster: HistoricalDisaster }) {
  const major = isMajor(disaster.casualties);
  const date = new Date(disaster.event_date);

  return (
    <article className="relative pl-8">
      <span
        aria-hidden="true"
        className="absolute left-0 top-6 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-earth-dark"
        style={{ backgroundColor: major ? "#C0392B" : "#E8743B" }}
      />

      <div
        className={`rounded-xl border border-earth-border bg-earth-surface p-4 shadow-raised sm:p-5 ${
          major ? "ring-1 ring-risk-red/25" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-fluid-000 tabular-nums text-text-muted">
              <time dateTime={disaster.event_date}>
                {date.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </p>
            <h3
              className={`mt-1 font-bold tracking-tight ${major ? "text-fluid-2" : "text-fluid-1"}`}
            >
              {disaster.name}
            </h3>
          </div>
          {disaster.magnitude != null && (
            <MagnitudeBadge
              magnitude={disaster.magnitude}
              // Historical entries carry no depth in the dataset; 20 km is a
              // stand-in that keeps the badge on the shallow end of the ramp,
              // which is where destructive events overwhelmingly sit.
              depthKm={20}
              size={major ? 54 : 42}
            />
          )}
        </div>

        <p className="mt-3 text-fluid-00 leading-relaxed text-text-secondary">
          {disaster.description}
        </p>

        {(disaster.casualties != null || disaster.displaced != null) && (
          <dl className="mt-4 flex flex-wrap gap-3">
            {disaster.casualties != null && (
              <div className="rounded-lg border border-risk-red/25 bg-risk-red/[0.06] px-3.5 py-2">
                <dt className="text-fluid-000 text-text-muted">Korban jiwa</dt>
                <dd className="font-mono text-fluid-1 font-bold tabular-nums text-risk-red">
                  {num(disaster.casualties)}
                </dd>
              </div>
            )}
            {disaster.displaced != null && (
              <div className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-2">
                <dt className="text-fluid-000 text-text-muted">Mengungsi</dt>
                <dd className="font-mono text-fluid-1 font-bold tabular-nums text-text-primary">
                  {num(disaster.displaced)}
                </dd>
              </div>
            )}
          </dl>
        )}

        {disaster.source_links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-earth-border pt-3 text-fluid-000">
            <span className="text-text-muted">Rujukan:</span>
            {disaster.source_links.map((link, i) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-depth-blue underline underline-offset-2 transition-colors hover:text-seismic-bright"
              >
                Sumber {i + 1} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

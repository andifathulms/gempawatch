import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import type { HistoricalDisaster } from "@/lib/types";

// Most impactful entries (higher casualties) get more visual weight.
function weight(casualties: number | null): "major" | "normal" {
  return (casualties ?? 0) >= 5000 ? "major" : "normal";
}

export function DisasterEntry({ disaster }: { disaster: HistoricalDisaster }) {
  const isMajor = weight(disaster.casualties) === "major";
  return (
    <article className="relative pl-8">
      {/* timeline node */}
      <span
        className="absolute left-0 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-earth-dark"
        style={{ backgroundColor: isMajor ? "#C0392B" : "#E8743B" }}
      />
      <div
        className={`rounded-xl border border-earth-border bg-earth-surface p-4 ${
          isMajor ? "ring-1 ring-risk-red/30" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-text-muted">
              {new Date(disaster.event_date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h3 className={`font-semibold ${isMajor ? "text-lg" : "text-base"}`}>
              {disaster.name}
            </h3>
          </div>
          {disaster.magnitude != null && (
            <MagnitudeBadge
              magnitude={disaster.magnitude}
              depthKm={20}
              size={isMajor ? 52 : 40}
            />
          )}
        </div>

        <p className="mt-2 text-sm text-text-secondary">{disaster.description}</p>

        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {disaster.casualties != null && (
            <span>
              <span className="text-text-muted">Korban jiwa: </span>
              <span className="font-mono text-risk-red">
                {disaster.casualties.toLocaleString("id-ID")}
              </span>
            </span>
          )}
          {disaster.displaced != null && (
            <span>
              <span className="text-text-muted">Mengungsi: </span>
              <span className="font-mono">
                {disaster.displaced.toLocaleString("id-ID")}
              </span>
            </span>
          )}
        </div>

        {disaster.source_links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {disaster.source_links.map((link, i) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-depth-blue underline underline-offset-2 hover:text-seismic-orange"
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

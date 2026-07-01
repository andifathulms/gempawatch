import type { HistoricalDisaster } from "@/lib/types";
import { DisasterEntry } from "./DisasterEntry";

// Vertical scrolling timeline — the shareable, educational, emotional layer.
export function DisasterTimeline({ disasters }: { disasters: HistoricalDisaster[] }) {
  if (disasters.length === 0) {
    return (
      <p className="py-8 text-center text-text-muted">
        Data bencana historis belum tersedia.
      </p>
    );
  }
  return (
    <div className="relative space-y-6 border-l border-earth-border pl-2">
      {disasters.map((d) => (
        <DisasterEntry key={d.id} disaster={d} />
      ))}
    </div>
  );
}

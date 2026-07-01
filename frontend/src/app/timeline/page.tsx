import { api } from "@/lib/api";
import type { HistoricalDisaster } from "@/lib/types";
import { DisasterTimeline } from "@/components/timeline/DisasterTimeline";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

export const revalidate = 86400;

export const metadata = {
  title: "Sejarah Bencana Gempa Indonesia — GempaWatch",
  description:
    "Arsip gempa dan tsunami besar Indonesia: Aceh 2004, Yogyakarta 2006, Palu 2018, dan lainnya.",
};

export default async function TimelinePage() {
  let disasters: HistoricalDisaster[] = [];
  try {
    disasters = await api.disasterTimeline();
  } catch {
    disasters = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Memori Bencana
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Arsip gempa dan tsunami besar yang membentuk kesadaran kebencanaan
          Indonesia. Belajar dari sejarah untuk kesiapsiagaan hari ini.
        </p>
      </div>

      <DisasterTimeline disasters={disasters} />

      <SourceAttribution sources={["BMKG", "USGS"]} />
    </div>
  );
}

import { api } from "@/lib/api";
import type { HistoricalDisaster } from "@/lib/types";
import { DisasterTimeline } from "@/components/timeline/DisasterTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader
        title="Memori Bencana"
        subtitle="Arsip gempa dan tsunami besar yang membentuk kesadaran kebencanaan Indonesia. Belajar dari sejarah untuk kesiapsiagaan hari ini."
      />

      <DisasterTimeline disasters={disasters} />

      <SourceAttribution sources={["BMKG", "USGS"]} />
    </div>
  );
}

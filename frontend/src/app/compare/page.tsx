import { Suspense } from "react";

import { CompareResult } from "./CompareResult";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { CompareSelector } from "@/components/discover/CompareSelector";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

export const revalidate = 3600;

export const metadata = {
  title: "Bandingkan Wilayah — GempaWatch",
  description: "Bandingkan profil risiko gempa dua kota/kabupaten berdampingan.",
};

// The region list is the same for everyone, so it is fetched once at render.
// The chosen pair lives in ?a=&b= and is resolved in the browser — see
// CompareResult — which is what lets this page be a single static file.
export default async function ComparePage() {
  const options = (await api
    .leaderboard(50, "desc")
    .then((r) => r.results)
    .catch(() => []))
    .map((r) => ({ slug: r.slug, name: r.region_name }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bandingkan Wilayah"
        subtitle="Lihat dua profil risiko berdampingan. Persentil memberi konteks relatif nasional."
      />

      <Card>
        <Suspense fallback={null}>
          <CompareSelector options={options} />
        </Suspense>
      </Card>

      <Suspense fallback={null}>
        <CompareResult />
      </Suspense>

      <SourceAttribution />
    </div>
  );
}

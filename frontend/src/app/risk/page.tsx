import type { Metadata } from "next";
import { Suspense } from "react";

import { RiskQueryResult } from "./RiskQueryResult";
import { Card } from "@/components/ui/Card";
import { pageMetadata } from "@/lib/meta";

// Coordinates arrive as ?lat=&lng=, so the metadata cannot describe a specific
// location — a static host serves one HTML file for every point. Live deploys
// keep the per-location OG card on /risk/[lat]/[lng].
export const metadata: Metadata = pageMetadata({
  title: "Laporan Risiko",
  description:
    "Laporan risiko gempa historis untuk titik koordinat pilihanmu, berdasarkan data BMKG dan USGS.",
  path: "/risk",
});

export default function RiskQueryPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <p className="py-10 text-center text-text-muted">Memuat…</p>
        </Card>
      }
    >
      <RiskQueryResult />
    </Suspense>
  );
}

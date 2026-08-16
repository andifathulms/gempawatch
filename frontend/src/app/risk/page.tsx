import type { Metadata } from "next";
import { Suspense } from "react";

import { RiskQueryResult } from "./RiskQueryResult";
import { Card } from "@/components/ui/Card";
import { pageMetadata } from "@/lib/meta";

// Coordinates arrive as ?lat=&lng=, so the metadata cannot describe a specific
// location — a static host serves one HTML file for every point. Live deploys
// keep the per-location OG card on /risk/[lat]/[lng].
//
// Not a destination (DESIGN.md §10 step 5) — noindexed, canonical at "/",
// same as /risk-check, /compare and /explore. Unlike those three this route
// still does real work when opened with ?lat=&lng= (a real shared permalink,
// same job /risk/[lat]/[lng] does on live builds) — only a bare visit with no
// usable coordinates redirects, in RiskQueryResult's "invalid" branch.
export const metadata: Metadata = pageMetadata({
  title: "Laporan Risiko",
  description:
    "Laporan risiko gempa historis untuk titik koordinat pilihanmu, berdasarkan data BMKG dan USGS.",
  path: "/risk",
  canonicalPath: "/",
  noindex: true,
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

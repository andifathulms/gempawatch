import Link from "next/link";
import type { Metadata } from "next";

import { RiskReportView } from "@/components/risk/RiskReportView";
import { api, IS_STATIC } from "@/lib/api";
import { riskTierLabel } from "@/lib/seismic";
import type { RiskCheckReport } from "@/lib/types";

// Server-rendered, shareable risk result. The interactive tool links here once
// a point is chosen, giving every result a stable URL that unfurls an OG card.
//
// Static builds cannot serve an unbounded set of coordinate paths, so this
// route generates nothing there and /risk/?lat=&lng= takes over. See
// lib/routes.ts, which is what decides where the tool links.

function parseCoords(latStr: string, lngStr: string) {
  return { lat: Number(latStr), lng: Number(lngStr) };
}

export function generateStaticParams(): { lat: string; lng: string }[] {
  return [];
}

export const dynamicParams = !IS_STATIC;

export async function generateMetadata({
  params,
}: {
  params: { lat: string; lng: string };
}): Promise<Metadata> {
  const { lat, lng } = parseCoords(params.lat, params.lng);
  try {
    const r = await api.riskCheck(lat, lng);
    const place = r.nearest_region?.name ?? "lokasi ini";
    const title = `Risiko gempa ${place}: ${riskTierLabel(r.activity_tier)} — GempaWatch`;
    return {
      title,
      description: `Skor ${r.composite_score.toFixed(0)}/100, ${r.event_count_m4_within_50km} gempa M4+ dalam 50km. Cek risiko lokasimu.`,
    };
  } catch {
    return { title: "Cek Risiko Gempa — GempaWatch" };
  }
}

export default async function RiskResultPage({
  params,
}: {
  params: { lat: string; lng: string };
}) {
  const { lat, lng } = parseCoords(params.lat, params.lng);
  let report: RiskCheckReport | null = null;
  try {
    report = await api.riskCheck(lat, lng);
  } catch {
    report = null;
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <p className="text-text-secondary">Gagal memuat laporan risiko untuk titik ini.</p>
        <Link href="/risk-check" className="text-seismic-orange underline">
          Coba lokasi lain →
        </Link>
      </div>
    );
  }

  return <RiskReportView report={report} lat={lat} lng={lng} />;
}

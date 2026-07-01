import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { RiskCheckReport } from "@/lib/types";
import { ShareableRiskCard } from "@/components/risk/ShareableRiskCard";
import { ShareButton } from "@/components/ui/ShareButton";
import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { WatchSubscribeForm } from "@/components/prepare/WatchSubscribeForm";
import { Card } from "@/components/ui/Card";
import { riskTierLabel } from "@/lib/seismic";

// Server-rendered, shareable risk result. The interactive tool links here once
// a point is chosen, giving every result a stable URL that unfurls an OG card.

function parseCoords(latStr: string, lngStr: string) {
  return { lat: Number(latStr), lng: Number(lngStr) };
}

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

  const place = report.nearest_region?.name ?? "lokasi ini";
  const caption = `Risiko gempa ${place}: ${riskTierLabel(
    report.activity_tier,
  )} (skor ${report.composite_score.toFixed(0)}/100). Cek lokasimu di GempaWatch:`;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Risiko</h1>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      </div>

      <ShareableRiskCard report={report} />

      <ShareButton path={`/risk/${lat}/${lng}`} caption={caption} />

      <Card title="Langkah Kesiapsiagaan">
        <PreparednessChecklist
          tier={report.activity_tier}
          coastal={report.tsunami_risk_tier != null}
        />
      </Card>

      <Card title="Pantau Lokasi Ini">
        <WatchSubscribeForm
          lat={lat}
          lng={lng}
          defaultLabel={report.nearest_region?.name ?? ""}
        />
      </Card>

      <Link
        href="/risk-check"
        className="block text-center text-sm text-text-secondary hover:text-seismic-orange"
      >
        ← Cek lokasi lain di peta
      </Link>
    </div>
  );
}

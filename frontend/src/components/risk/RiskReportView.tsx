import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { ShareButton } from "@/components/ui/ShareButton";
import { ShareableRiskCard } from "@/components/risk/ShareableRiskCard";
import { WatchSubscribeForm } from "@/components/prepare/WatchSubscribeForm";
import { IS_STATIC } from "@/lib/api";
import { riskResultPath } from "@/lib/routes";
import { riskTierLabel } from "@/lib/seismic";
import type { RiskCheckReport } from "@/lib/types";

interface Props {
  report: RiskCheckReport;
  lat: number;
  lng: number;
}

/**
 * The body of a risk result, shared by both route shapes: the server-rendered
 * /risk/[lat]/[lng] used on live deploys and the client-rendered /risk?lat=&lng=
 * used on static ones. Keeping it in one place is what stops the two from
 * drifting into different reports.
 */
export function RiskReportView({ report, lat, lng }: Props) {
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

      <ShareButton path={riskResultPath(lat, lng)} caption={caption} />

      <Card title="Langkah Kesiapsiagaan">
        <PreparednessChecklist
          tier={report.activity_tier}
          coastal={report.tsunami_risk_tier != null}
        />
      </Card>

      {/*
        Watch alerts need a backend to store the subscription and send mail.
        The feature is kept intact for live deploys and simply not offered when
        there is nothing to receive the form.
      */}
      {!IS_STATIC && (
        <Card title="Pantau Lokasi Ini">
          <WatchSubscribeForm
            lat={lat}
            lng={lng}
            defaultLabel={report.nearest_region?.name ?? ""}
          />
        </Card>
      )}

      <Link
        href="/risk-check"
        className="block text-center text-sm text-text-secondary hover:text-seismic-orange"
      >
        ← Cek lokasi lain di peta
      </Link>
    </div>
  );
}

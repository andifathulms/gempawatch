import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { ShareButton } from "@/components/ui/ShareButton";
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { ShareableRiskCard } from "@/components/risk/ShareableRiskCard";
import { WatchSubscribeForm } from "@/components/prepare/WatchSubscribeForm";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
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
 *
 * Sharing is the point of this page — it is the URL people send each other — so
 * the share row sits directly under the card rather than at the end of the
 * page, where it was previously below a checklist and a subscribe form.
 */
export function RiskReportView({ report, lat, lng }: Props) {
  const place = report.nearest_region?.name ?? "lokasi ini";
  const caption = `Risiko gempa ${place}: ${riskTierLabel(
    report.activity_tier,
  )} (skor ${report.composite_score.toFixed(0)}/100). Cek lokasimu di GempaWatch:`;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <p className="font-display text-fluid-000 font-semibold uppercase tracking-[0.16em] text-seismic-orange">
          Laporan risiko titik
        </p>
        <h1 className="mt-1.5 text-fluid-3 font-bold tracking-tight">
          {report.nearest_region?.name ?? "Lokasi pilihanmu"}
        </h1>
        <p className="mt-1 font-mono text-fluid-000 tabular-nums text-text-muted">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      </header>

      <ShareableRiskCard report={report} />

      <Card
        title="Dari mana skor ini datang"
        subtitle="Empat komponen berbobot, dihitung dari catatan gempa di sekitar titik ini."
      >
        <ScoreBreakdown
          components={report.score_breakdown}
          total={report.composite_score}
        />
      </Card>

      <Card
        title="Bagikan hasil ini"
        subtitle="WhatsApp adalah kanal berbagi utama di Indonesia — tautannya membuka laporan yang sama persis."
      >
        <ShareButton path={riskResultPath(lat, lng)} caption={caption} />
      </Card>

      <Card
        title="Langkah kesiapsiagaan"
        subtitle="Disesuaikan dengan tingkat aktivitas dan status pesisir titik ini."
      >
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
        <Card
          title="Pantau lokasi ini"
          subtitle="Dapatkan email ketika gempa signifikan tercatat di dekat titik ini."
        >
          <WatchSubscribeForm
            lat={lat}
            lng={lng}
            defaultLabel={report.nearest_region?.name ?? ""}
          />
        </Card>
      )}

      <SourceAttribution />

      <Link
        href="/risk-check"
        className="block rounded-lg border border-earth-border py-3 text-center text-fluid-00 text-text-secondary transition-colors hover:border-seismic-orange hover:text-seismic-bright"
      >
        ← Cek lokasi lain di peta
      </Link>
    </div>
  );
}

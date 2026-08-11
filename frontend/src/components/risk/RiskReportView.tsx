import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { ShareButton } from "@/components/ui/ShareButton";
import { CoverageNote } from "@/components/risk/CoverageNote";
import { LargestEventSensitivity } from "@/components/risk/LargestEventSensitivity";
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

const RELATION_LABEL: Record<string, string> = {
  higher: "lebih tinggi",
  lower: "lebih rendah",
  similar: "serupa",
};

/**
 * The body of a risk result, shared by both route shapes: the server-rendered
 * /risk/[lat]/[lng] used on live deploys and the client-rendered /risk?lat=&lng=
 * used on static ones. Keeping it in one place is what stops the two from
 * drifting into different reports.
 *
 * Sharing is the point of this page — it is the URL people send each other — so
 * the share row sits directly under the card rather than at the end of the
 * page, where it was previously below a checklist and a subscribe form.
 *
 * The page reads in two tiers. First the answer and what to do with it: the
 * result card, sharing, preparedness. Then the audit trail — the four panels
 * explaining how the number was reached — under their own heading, so they
 * stop competing with the answer for a first-time reader's attention. The
 * methodology panels had drifted between the card and the share row, which
 * pushed sharing below about four screens of dense explanation and left every
 * panel claiming equal importance.
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

      {/* ------------------------------------------------------------------
          The audit trail.

          Every panel on this page was a Card of identical weight, so the
          answer, the way to share it, and four dense methodology panels all
          read as equally important — and the share row, which this file's own
          docblock calls the point of the page, had sunk below roughly four
          screens of explanation.

          Grouping the four under one heading gives the page two tiers instead
          of one flat stack: what your risk is, then how the number was made.
          Nothing is hidden — collapsing these would be a behaviour change and
          would need to survive a refresh — they are just marked as the second
          tier, with eyebrow titles so they stop competing with the answer.
         ------------------------------------------------------------------ */}
      <section aria-labelledby="audit-trail" className="space-y-4 pt-2">
        <div className="border-t border-earth-border pt-5">
          <h2
            id="audit-trail"
            className="font-display text-fluid-1 font-semibold tracking-tight text-text-primary"
          >
            Bagaimana angka ini dibaca
          </h2>
          <p className="mt-1 text-fluid-00 leading-relaxed text-text-secondary">
            Setiap angka di atas bisa ditelusuri ke aturannya. Empat panel
            berikut menunjukkan perhitungannya, cakupan datanya, dan batasnya.
          </p>
        </div>

        <Card
          titleAs="eyebrow"
          title="Dari mana skor ini datang"
          subtitle="Empat komponen berbobot, dihitung dari catatan gempa di sekitar titik ini."
        >
          <ScoreBreakdown
            components={report.score_breakdown}
            total={report.composite_score}
          />
        </Card>

        {report.largest_event_sensitivity && (
          <Card
            titleAs="eyebrow"
            title="Seberapa besar peran satu gempa"
            subtitle="Komponen magnitudo memakai kejadian terbesar, bukan rata-rata, dan tidak melemah seiring waktu."
          >
            <LargestEventSensitivity
              sensitivity={report.largest_event_sensitivity}
              score={report.composite_score}
            />
          </Card>
        )}

        <Card
          titleAs="eyebrow"
          title="Cakupan data di balik angka ini"
          subtitle="Pembagi yang dipakai komponen frekuensi, dan apa yang tidak ada dalam catatan."
        >
          <CoverageNote
            earliestYear={report.data_coverage.earliest_year}
            latestYear={report.data_coverage.latest_year}
            years={report.data_coverage.years}
            scope="point"
          />
        </Card>

        {/* One anchor cannot place you on a range. Jakarta alone says "more
            active than Jakarta" without revealing whether that means slightly,
            or nowhere near Padang. */}
        <Card
          titleAs="eyebrow"
          title="Dibanding kota acuan"
          subtitle="Jumlah gempa M4+ dalam radius 50 km, dibanding tiga kota yang polanya sudah dikenal."
        >
          <ul className="divide-y divide-earth-border/70">
            {report.comparison_set.map((c) => (
              <li
                key={c.reference_city}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <span className="text-fluid-00 text-text-primary">
                  {c.reference_city}
                  <span className="ml-2 font-mono text-fluid-000 tabular-nums text-text-muted">
                    ±{c.reference_m4_count} M4+
                  </span>
                </span>
                <span
                  className={`shrink-0 text-fluid-00 font-medium ${
                    c.relation === "higher"
                      ? "text-risk-amber"
                      : c.relation === "lower"
                        ? "text-risk-green"
                        : "text-text-secondary"
                  }`}
                >
                  {RELATION_LABEL[c.relation] ?? c.relation}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-fluid-00 leading-relaxed text-text-muted">
            Angka acuan adalah perkiraan tetap, dipakai hanya untuk menempatkan
            lokasi ini pada rentang — bukan skor resmi kota tersebut.
          </p>
        </Card>
      </section>

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

import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { WatchSubscribeForm } from "@/components/prepare/WatchSubscribeForm";
import { CoverageNote } from "@/components/risk/CoverageNote";
import { LargestEventSensitivity } from "@/components/risk/LargestEventSensitivity";
import { PointSeismogram } from "@/components/risk/PointSeismogram";
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { ShareableRiskCard } from "@/components/risk/ShareableRiskCard";
import { TsunamiEvidencePanel } from "@/components/risk/TsunamiEvidencePanel";
import { FactRow, VerdictBand } from "@/components/risk/VerdictBand";
import { Disclosure, DisclosureGroup } from "@/components/ui/Disclosure";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { ShareButton } from "@/components/ui/ShareButton";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { IS_STATIC } from "@/lib/api";
import { magnitude, num } from "@/lib/format";
import { riskResultPath } from "@/lib/routes";
import { riskTierLabel } from "@/lib/seismic";
import type { RiskCheckReport } from "@/lib/types";

interface Props {
  report: RiskCheckReport;
  lat: number;
  lng: number;
  /**
   * h1 on the standalone permalink page; h2 on the homepage, where the
   * question above it is already the h1.
   */
  headingLevel?: 1 | 2;
  /** Count the score up as the result lands — homepage (client) only. */
  animate?: boolean;
}

const RELATION_LABEL: Record<string, string> = {
  higher: "lebih tinggi",
  lower: "lebih rendah",
  similar: "serupa",
};

/**
 * The body of a risk result, shared by the homepage (in place), the
 * server-rendered /risk/[lat]/[lng] on live deploys and /risk?lat=&lng= on
 * static ones — one component so the three can never drift.
 *
 * Full width, read top to bottom: the verdict and where it sits among every
 * scored region; four facts; the fifty-year record against a reference city;
 * what to do and how to share it; then how the number was made. The previous
 * version sat in a half-width column and ran to ~7,000px, with four
 * methodology panels at the same weight as the answer. Those now live in
 * expandable rows — still on the page, still indexed, one tap away.
 */
export function RiskReportView({ report, lat, lng, headingLevel = 2, animate = false }: Props) {
  const place = report.nearest_region?.name ?? "Lokasi pilihanmu";
  const caption = `Risiko gempa ${place}: ${riskTierLabel(report.activity_tier)} (skor ${report.composite_score.toFixed(
    0,
  )}/100). Cek lokasimu di GempaWatch:`;
  const coverage = report.data_coverage;
  const since = coverage.earliest_year ? ` sejak ${coverage.earliest_year}` : "";
  const drawKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  return (
    <article className="space-y-12 sm:space-y-14">
      <VerdictBand
        headingLevel={headingLevel}
        animateScore={animate}
        eyebrow="Laporan risiko titik"
        place={place}
        meta={
          <>
            <span className="font-mono tabular-nums">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
            {report.nearest_region && " · wilayah terdekat"}
          </>
        }
        score={report.composite_score}
        tier={report.activity_tier}
        plotLabel="Titik ini"
        finding={
          <>
            Dalam radius 50 km tercatat{" "}
            <b className="font-bold">{num(report.event_count_m4_within_50km)} gempa M4 ke atas</b>
            {since}
            {report.largest_magnitude_within_50km != null && (
              <>
                ; yang terbesar <b className="font-bold">{magnitude(report.largest_magnitude_within_50km)}</b>
              </>
            )}
            . {report.comparison.text}
          </>
        }
      />

      <FactRow
        facts={[
          { value: num(report.event_count_m4_within_50km), label: "gempa M4+ dalam 50 km" },
          { value: magnitude(report.largest_magnitude_within_50km), label: "terbesar dalam 50 km" },
          report.nearest_fault?.distance_km != null
            ? {
                value: `${report.nearest_fault.distance_km.toFixed(0)} km`,
                label: `ke ${report.nearest_fault.name}, sesar aktif terdekat`,
              }
            : { value: "—", label: "sesar aktif terdekat tidak tercatat" },
          report.tsunami_risk_tier
            ? {
                value: (
                  <span className="text-fluid-2">
                    <RiskTierBadge tier={report.tsunami_risk_tier} />
                  </span>
                ),
                label: "riwayat tsunami (wilayah pesisir)",
              }
            : { value: "—", label: "bukan wilayah pesisir" },
        ]}
      />

      <PointSeismogram
        nearestRegion={report.nearest_region}
        referenceCity={report.comparison.reference_city}
        drawKey={drawKey}
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-labelledby="langkah">
          <h2 id="langkah" className="text-fluid-3 font-extrabold tracking-tight">
            Yang bisa kamu lakukan
          </h2>
          <p className="mb-4 mt-1 text-fluid-00 text-ink-2">
            Mulai dari tiga langkah ini. Disesuaikan dengan tingkat aktivitas
            {report.tsunami_risk_tier != null ? " dan status pesisir" : ""} titik ini.
          </p>
          <PreparednessChecklist
            tier={report.activity_tier}
            coastal={report.tsunami_risk_tier != null}
            initialVisible={3}
          />
          {!IS_STATIC && (
            <div className="mt-8 border-t border-rule pt-6">
              <h3 className="text-fluid-1 font-bold">Pantau lokasi ini</h3>
              <p className="mb-3 mt-1 text-fluid-00 text-ink-2">
                Dapatkan email ketika gempa signifikan tercatat di dekat titik ini.
              </p>
              <WatchSubscribeForm lat={lat} lng={lng} defaultLabel={report.nearest_region?.name ?? ""} />
            </div>
          )}
        </section>

        <section aria-labelledby="bagikan">
          <h2 id="bagikan" className="text-fluid-3 font-extrabold tracking-tight">
            Bagikan
          </h2>
          <p className="mb-4 mt-1 text-fluid-00 text-ink-2">
            Tautannya membuka laporan yang sama persis. Kartu ini aman di-screenshot — sumber dan
            catatannya ikut di dalamnya.
          </p>
          <ShareableRiskCard report={report} />
          <div className="mt-4">
            <ShareButton path={riskResultPath(lat, lng)} caption={caption} />
          </div>
        </section>
      </div>

      <section aria-labelledby="metodologi">
        <h2 id="metodologi" className="text-fluid-3 font-extrabold tracking-tight">
          Bagaimana angka ini dibuat
        </h2>
        <p className="mb-4 mt-1 max-w-[70ch] text-fluid-00 text-ink-2">
          Setiap angka di atas bisa ditelusuri ke aturannya. Buka bagian yang ingin kamu periksa.
        </p>
        <DisclosureGroup>
          <Disclosure
            title={`Dari mana skor ${Math.round(report.composite_score)} datang`}
            summary="Empat komponen berbobot, dari catatan gempa di sekitar titik ini"
          >
            <ScoreBreakdown components={report.score_breakdown} total={report.composite_score} />
          </Disclosure>
          {report.largest_event_sensitivity && (
            <Disclosure
              title="Seberapa besar peran satu gempa"
              summary="Komponen magnitudo memakai kejadian terbesar, bukan rata-rata"
            >
              <LargestEventSensitivity
                sensitivity={report.largest_event_sensitivity}
                score={report.composite_score}
              />
            </Disclosure>
          )}
          <Disclosure
            title="Dari mana tingkat tsunami ini datang"
            summary="Tiga syarat yang harus terpenuhi sekaligus"
          >
            <TsunamiEvidencePanel evidence={report.tsunami_evidence} />
          </Disclosure>
          <Disclosure
            title="Cakupan data"
            summary={
              coverage.earliest_year && coverage.latest_year
                ? `${coverage.earliest_year}–${coverage.latest_year} · ${num(report.event_count_m4_within_50km)} gempa M4+ dalam 50 km`
                : undefined
            }
          >
            <CoverageNote
              earliestYear={coverage.earliest_year}
              latestYear={coverage.latest_year}
              years={coverage.years}
              m4Count={report.event_count_m4_within_50km}
              scope="point"
            />
          </Disclosure>
          {report.comparison_set.length > 0 && (
            <Disclosure title="Dibanding kota acuan" summary={report.comparison.text}>
              <ul className="divide-y divide-rule">
                {report.comparison_set.map((c) => (
                  <li key={c.reference_city} className="flex items-baseline justify-between gap-3 py-2.5">
                    <span className="text-fluid-00 text-ink">
                      {c.reference_city}
                      <span className="ml-2 font-mono text-fluid-000 tabular-nums text-ink-3">
                        ±{c.reference_m4_count} M4+
                      </span>
                    </span>
                    <span className="shrink-0 text-fluid-00 font-semibold text-ink-2">
                      {RELATION_LABEL[c.relation] ?? c.relation}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-fluid-00 leading-relaxed text-ink-3">
                Angka acuan adalah perkiraan tetap, dipakai hanya untuk menempatkan lokasi ini pada
                rentang — bukan skor resmi kota tersebut.
              </p>
            </Disclosure>
          )}
        </DisclosureGroup>
      </section>

      <footer className="space-y-3">
        <p className="max-w-[80ch] border-l-2 border-rule-strong pl-3 text-fluid-00 leading-relaxed text-ink-3">
          {/* methodology_note already carries the not-a-warning line; this
              only adds the official destination it points to. */}
          {report.methodology_note}{" "}
          <a
            href="https://www.bmkg.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-2 underline underline-offset-2"
          >
            bmkg.go.id ↗
          </a>
        </p>
        <SourceAttribution />
      </footer>
    </article>
  );
}

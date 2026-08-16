import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, IS_STATIC } from "@/lib/api";
import type { RegionRiskProfile, RegionTimeline } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { RiskProfileCard } from "@/components/risk/RiskProfileCard";
import { MagnitudeFreqChart } from "@/components/risk/MagnitudeFreqChart";
import { DepthHistogram } from "@/components/risk/DepthHistogram";
import { RegionSeismogram } from "@/components/risk/RegionSeismogram";
import { ShareButton } from "@/components/ui/ShareButton";
import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { RegionJsonLd } from "@/components/seo/JsonLd";
import { CoverageNote } from "@/components/risk/CoverageNote";
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { scoreBreakdown, scoreInputsFromProfile } from "@/lib/engine/scoring";
import { pageMetadata } from "@/lib/meta";
import { binByDepth, riskTierLabel } from "@/lib/seismic";
import { magnitude, num, regionType } from "@/lib/format";

export const revalidate = 3600;

/**
 * Static builds prerender every region up front, since a static host has no way
 * to render one on demand. Live builds return nothing here and keep rendering
 * on request, so a newly loaded region shows up without a rebuild.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (!IS_STATIC) return [];
  const { results } = await api.regions();
  return results.map((region) => ({ slug: region.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const p = await api.riskProfile(params.slug);
    /*
      One string, used for the tab, the search result and the unfurl.

      Previously only `title` and `description` were set here, so every region
      fell through to the layout's static openGraph block — all 24 unfurled as
      "GempaWatch — Intelijen Risiko Gempa Indonesia" with the generic blurb.
      Worse, that generic og:description sat next to a page-specific
      <meta name="description">, so the two contradicted each other on the same
      page. Deriving both from `p` is what stops them drifting again.
    */
    const title = `Risiko gempa ${p.region.name}: ${riskTierLabel(p.activity_tier)}`;
    const description = `Skor ${p.composite_score?.toFixed(0) ?? "—"}/100 · ${p.event_count_m4} gempa M4+ dalam 100km · terbesar ${
      p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—"
    }. Profil risiko historis berbasis data BMKG & USGS.`;
    // Through pageMetadata, not by hand: it is what applies the base path, and
    // building the URL locally here is precisely how this route ended up with a
    // canonical pointing at the origin root instead of the deployed subpath.
    const base = pageMetadata({
      title,
      description,
      path: `/region/${p.region.slug}`,
      // Rendered by scripts/generate-og.tsx during the static publish. Next's
      // opengraph-image convention cannot do this on an export — it rejects
      // generateStaticParams in metadata image routes — so the card is built
      // alongside and pointed at here.
      image: `/og/region-${p.region.slug}.png`,
    });
    return { ...base, openGraph: { ...base.openGraph, type: "article" } };
  } catch {
    return { title: "Profil Risiko Wilayah" };
  }
}

export default async function RegionPage({
  params,
}: {
  params: { slug: string };
}) {
  let profile: RegionRiskProfile;
  let timeline: RegionTimeline;
  try {
    [profile, timeline] = await Promise.all([
      api.riskProfile(params.slug),
      api.regionTimeline(params.slug),
    ]);
  } catch {
    notFound();
  }

  /*
    Binned here, at build time, rather than in the browser.

    DepthHistogram is a client component; passing the full event array to it
    just for five integers made React serialise all 903 events into the HTML
    for a region like Kepulauan Mentawai — 93.9 kB of a 350 kB page.
  */
  const depthBins = binByDepth(timeline.events);
  // `id` is read by nothing here — every field on a client component's props
  // ends up in the HTML, so only project what's actually plotted or read.
  const seismogramEvents = timeline.events.map((e) => ({
    event_time: e.event_time,
    magnitude: e.magnitude,
    depth_km: e.depth_km,
    source: e.source,
  }));

  const scoreInputs = scoreInputsFromProfile(profile);

  /*
   * The finding in prose, not a stat row (DESIGN.md §7 item 2) — replaces the
   * four-StatTile row that used to sit here (skor/persentil/magnitudo/tsunami),
   * which was the dashboard reflex this rework exists to remove. The activity
   * score, percentile, and tsunami tier still live in RiskProfileCard right
   * below; this sentence states the M5+ record itself.
   */
  const coverage =
    profile.earliest_event_year && profile.latest_event_year
      ? `${profile.earliest_event_year}–${profile.latest_event_year}`
      : null;
  const coverageYears =
    profile.earliest_event_year && profile.latest_event_year
      ? profile.latest_event_year - profile.earliest_event_year
      : null;
  const largestEventYear = profile.largest_event
    ? new Date(profile.largest_event.event_time).getFullYear()
    : null;
  const headline = [
    coverageYears
      ? `Dalam ${coverageYears} tahun terakhir (${coverage}) tercatat ${num(profile.event_count_m5)} gempa M5 ke atas dalam radius 100 km dari ${profile.region.name}.`
      : `Tercatat ${num(profile.event_count_m5)} gempa M5 ke atas dalam radius 100 km dari ${profile.region.name}.`,
    profile.largest_magnitude != null && largestEventYear
      ? `Yang terbesar ${magnitude(profile.largest_magnitude)} pada ${largestEventYear}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <RegionJsonLd profile={profile} />
      <PageHeader
        eyebrow={regionType(profile.region.type)}
        title={profile.region.name}
        subtitle={`Profil risiko historis dari ${num(profile.event_count_m4)} gempa M4+ dalam radius 100 km, ${coverage ?? "catatan historis"}.`}
        action={
          <ShareButton
            path={`/region/${profile.region.slug}`}
            caption={`Risiko gempa ${profile.region.name}: ${riskTierLabel(
              profile.activity_tier,
            )} (skor ${profile.composite_score?.toFixed(0) ?? "—"}/100) menurut GempaWatch:`}
          />
        }
      />

      {/* The finding in prose — see the comment above `headline`. */}
      <p className="animate-fade-in-up max-w-3xl text-fluid-2 font-medium leading-snug text-text-primary">
        {headline}
      </p>

      {/*
        The signature object (DESIGN.md §5), full width, directly under the
        headline it backs up — per §7's target order this comes before the
        gauge and the distribution charts, not after them. RegionSeismogram
        renders its own SourceAttribution inline, so no Card footer here.
      */}
      <Card
        title="Rekaman gempa 1970–sekarang"
        subtitle={`${num(timeline.events.length)} kejadian tercatat. Satu paku per kejadian — tinggi menandai magnitudo, warna menandai kedalaman. Rentang tenang terpanjang dan gempa terbesar ditandai otomatis.`}
      >
        <RegionSeismogram regionName={profile.region.name} events={seismogramEvents} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RiskProfileCard profile={profile} />
        </div>

        {/* Data first, then how the number was made.

            The two methodology panels were inserted at the top of this column
            last pass, which pushed both charts below roughly a screen of prose.
            A reader arriving at a region page has already been given the
            headline figures above; what they want next is the shape of the
            data, not the derivation. The derivation follows, under eyebrow
            titles so it reads as the second tier — matching the risk report. */}
        <div className="space-y-5 lg:col-span-2">
          <Card
            title="Frekuensi magnitudo"
            subtitle="Berapa banyak gempa di tiap tingkat kekuatan, sepanjang catatan."
          >
            <MagnitudeFreqChart profile={profile} />
          </Card>

          <Card
            title="Distribusi kedalaman"
            subtitle="Kedalaman menentukan seberapa keras guncangan terasa di permukaan."
          >
            <DepthHistogram bins={depthBins} />
          </Card>

          {scoreInputs && (
            <Card
              titleAs="eyebrow"
              title="Dari mana skor ini datang"
              subtitle="Empat komponen berbobot, dihitung dari catatan gempa dalam radius 100 km."
            >
              <ScoreBreakdown
                components={scoreBreakdown(scoreInputs)}
                total={profile.composite_score ?? 0}
              />
            </Card>
          )}

          <Card
            titleAs="eyebrow"
            title="Cakupan data di balik angka ini"
            subtitle="Pembagi yang dipakai komponen frekuensi, dan apa yang tidak ada dalam catatan."
          >
            <CoverageNote
              earliestYear={profile.earliest_event_year}
              latestYear={profile.latest_event_year}
              years={scoreInputs?.coverageYears ?? 0}
              m4Count={profile.event_count_m4}
              scope="region"
            />
          </Card>
        </div>
      </div>

      <Card
        title="Langkah kesiapsiagaan"
        subtitle="Disesuaikan dengan tingkat aktivitas wilayah ini dan status pesisirnya."
      >
        <PreparednessChecklist
          tier={profile.activity_tier}
          coastal={profile.region.is_coastal}
        />
      </Card>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/risk-check" variant="secondary">
          Cek titik persismu di peta →
        </ButtonLink>
        <ButtonLink href="/compare" variant="secondary">
          Bandingkan dengan wilayah lain
        </ButtonLink>
      </div>
    </div>
  );
}

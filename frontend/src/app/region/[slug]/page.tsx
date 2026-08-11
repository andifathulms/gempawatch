import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, IS_STATIC } from "@/lib/api";
import type { RegionRiskProfile, RegionTimeline } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { RiskProfileCard } from "@/components/risk/RiskProfileCard";
import { MagnitudeFreqChart } from "@/components/risk/MagnitudeFreqChart";
import { DepthHistogram } from "@/components/risk/DepthHistogram";
import { EventScatterTimeline } from "@/components/risk/EventScatterTimeline";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
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

  const coverage =
    profile.earliest_event_year && profile.latest_event_year
      ? `${profile.earliest_event_year}–${profile.latest_event_year}`
      : "catatan historis";

  /*
    Binned here, at build time, rather than in the browser.

    DepthHistogram and EventScatterTimeline are sibling client components, so
    passing the event array to both made React serialise all 903 events into the
    HTML twice — 93.9 kB of the 350 kB Kepulauan Mentawai page, duplicated. The
    histogram only ever needed five integers.
  */
  const depthBins = binByDepth(timeline.events);
  // `id` and `source` are read by neither chart, but every field on a client
  // component's props ends up in the HTML. Project to what is actually plotted.
  const scatterPoints = timeline.events.map((e) => ({
    event_time: e.event_time,
    magnitude: e.magnitude,
    depth_km: e.depth_km,
  }));

  const scoreInputs = scoreInputsFromProfile(profile);
  const scoredRegionCount = profile.activity_percentile_basis?.region_count;

  return (
    <div className="space-y-6">
      <RegionJsonLd profile={profile} />
      <PageHeader
        eyebrow={regionType(profile.region.type)}
        title={profile.region.name}
        subtitle={`Profil risiko historis dari ${num(profile.event_count_m4)} gempa M4+ dalam radius 100 km, ${coverage}.`}
        action={
          <ShareButton
            path={`/region/${profile.region.slug}`}
            caption={`Risiko gempa ${profile.region.name}: ${riskTierLabel(
              profile.activity_tier,
            )} (skor ${profile.composite_score?.toFixed(0) ?? "—"}/100) menurut GempaWatch:`}
          />
        }
      />

      {/* Headline figures, so the page states its findings before any chart. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Skor aktivitas"
          value={profile.composite_score?.toFixed(0) ?? "—"}
          unit="/100"
          tone="accent"
        />
        {/* Not "nasional". The rank is against the regions this deployment has
            scored, and the gauge immediately below already says so — the two
            were contradicting each other a few hundred pixels apart, with the
            wrong claim set in the bigger type. */}
        <StatTile
          label="Persentil antar-wilayah terskor"
          value={
            profile.activity_percentile != null ? profile.activity_percentile : "—"
          }
          unit={profile.activity_percentile != null ? "%" : undefined}
          hint={
            scoredRegionCount
              ? `Dari ${scoredRegionCount} wilayah yang sudah diskor di sini — bukan seluruh Indonesia.`
              : "Dari wilayah yang sudah diskor di sini — bukan seluruh Indonesia."
          }
        />
        <StatTile
          label="Magnitudo terbesar tercatat"
          value={magnitude(profile.largest_magnitude)}
        />
        <StatTile
          label="Risiko tsunami historis"
          value={riskTierLabel(profile.tsunami_risk_tier)}
        />
      </div>

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
        title="Linimasa kegempaan"
        subtitle={`${num(timeline.events.length)} kejadian tercatat. Magnitudo pada sumbu Y, waktu pada sumbu X — kelompok titik yang rapat biasanya menandai rentetan gempa susulan.`}
        footer={<SourceAttribution />}
      >
        <EventScatterTimeline events={scatterPoints} />
      </Card>

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

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
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { scoreBreakdown, scoreInputsFromProfile } from "@/lib/engine/scoring";
import { riskTierLabel } from "@/lib/seismic";
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
    return {
      title: `Risiko gempa ${p.region.name}: ${riskTierLabel(p.activity_tier)} — GempaWatch`,
      description: `Skor ${p.composite_score?.toFixed(0) ?? "—"}/100 · ${p.event_count_m4} gempa M4+ dalam 100km · terbesar ${
        p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—"
      }. Profil risiko historis berbasis data BMKG & USGS.`,
    };
  } catch {
    return { title: "Profil Risiko Wilayah — GempaWatch" };
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

  const scoreInputs = scoreInputsFromProfile(profile);

  return (
    <div className="space-y-6">
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
        <StatTile
          label="Persentil nasional"
          value={
            profile.activity_percentile != null ? profile.activity_percentile : "—"
          }
          unit={profile.activity_percentile != null ? "%" : undefined}
          hint="Lebih aktif dari sekian persen wilayah lain di basis data."
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

        <div className="space-y-5 lg:col-span-2">
          {/* The score is the page's headline figure, so its arithmetic belongs
              directly under it rather than on a methodology page. Rebuilt from
              the stored inputs, so it reproduces composite_score exactly. */}
          {scoreInputs && (
            <Card
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
            title="Frekuensi magnitudo"
            subtitle="Berapa banyak gempa di tiap tingkat kekuatan, sepanjang catatan."
          >
            <MagnitudeFreqChart profile={profile} />
          </Card>

          <Card
            title="Distribusi kedalaman"
            subtitle="Kedalaman menentukan seberapa keras guncangan terasa di permukaan."
          >
            <DepthHistogram events={timeline.events} />
          </Card>
        </div>
      </div>

      <Card
        title="Linimasa kegempaan"
        subtitle={`${num(timeline.events.length)} kejadian tercatat. Magnitudo pada sumbu Y, waktu pada sumbu X — kelompok titik yang rapat biasanya menandai rentetan gempa susulan.`}
        footer={<SourceAttribution />}
      >
        <EventScatterTimeline events={timeline.events} />
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

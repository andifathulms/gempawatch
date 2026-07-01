import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { RegionRiskProfile, RegionTimeline } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { RiskProfileCard } from "@/components/risk/RiskProfileCard";
import { MagnitudeFreqChart } from "@/components/risk/MagnitudeFreqChart";
import { DepthHistogram } from "@/components/risk/DepthHistogram";
import { EventScatterTimeline } from "@/components/risk/EventScatterTimeline";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { ShareButton } from "@/components/ui/ShareButton";
import { riskTierLabel } from "@/lib/seismic";

export const revalidate = 3600;

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-muted">
          {profile.region.type}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {profile.region.name}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Profil risiko historis berdasarkan gempa dalam radius 100km.
        </p>
        <div className="mt-3">
          <ShareButton
            path={`/region/${profile.region.slug}`}
            caption={`Risiko gempa ${profile.region.name}: ${riskTierLabel(
              profile.activity_tier,
            )} (skor ${profile.composite_score?.toFixed(0) ?? "—"}/100) menurut GempaWatch:`}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RiskProfileCard profile={profile} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Frekuensi Magnitudo">
            <MagnitudeFreqChart profile={profile} />
          </Card>
          <Card title="Distribusi Kedalaman">
            <DepthHistogram events={timeline.events} />
          </Card>
        </div>
      </div>

      <Card title="Linimasa Kegempaan">
        <EventScatterTimeline events={timeline.events} />
        <p className="mt-2 text-xs text-text-muted">
          {timeline.events.length} kejadian tercatat. Magnitudo pada sumbu Y, waktu
          pada sumbu X — warna menandakan kedalaman.
        </p>
      </Card>

      <SourceAttribution />
    </div>
  );
}

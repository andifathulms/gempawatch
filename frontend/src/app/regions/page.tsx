import { api } from "@/lib/api";
import type { LeaderboardRow } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { RegionIndex, type RegionIndexRow } from "@/components/discover/RegionIndex";
import { islandOf } from "@/lib/islands";
import { depthBand } from "@/lib/seismic";
import { regionType } from "@/lib/format";
import { pageMetadata } from "@/lib/meta";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Wilayah — risiko gempa per kabupaten & kota",
  description:
    "Jelajahi skor aktivitas gempa historis setiap wilayah yang sudah diskor, dikelompokkan per pulau, dengan rekaman gempa M5+ sejak 1970. Data BMKG & USGS.",
  path: "/regions",
});

const BAND_INDEX = { shallow: 0, mid: 1, deep: 2 } as const;
const DOMAIN_START = Date.UTC(1970, 0, 1);

/**
 * The region index ("Wilayah", DESIGN.md §13).
 *
 * Every scored region had a prerendered page but no browsable way in once
 * /explore retired — only name search. This restores the explore path as a
 * grouped index rather than a leaderboard: island filters, and a mini M5+
 * record on every card so regions are compared by their history, not only
 * by a number.
 *
 * Built entirely at build time: the per-region timelines are reduced here to
 * M5+ spikes, so the page ships a few thousand short tuples instead of every
 * event.
 */
export default async function RegionsPage() {
  const [regions, desc, asc] = await Promise.all([
    api.regions().then((r) => r.results),
    api.leaderboard(50, "desc").then((r) => r.results).catch(() => [] as LeaderboardRow[]),
    api.leaderboard(50, "asc").then((r) => r.results).catch(() => [] as LeaderboardRow[]),
  ]);
  const scores = new Map<string, LeaderboardRow>();
  for (const r of [...desc, ...asc]) scores.set(r.slug, r);

  const now = Date.now();
  const span = now - DOMAIN_START;

  const rows: RegionIndexRow[] = await Promise.all(
    regions.map(async (region) => {
      const events = await api
        .regionTimeline(region.slug)
        .then((t) => t.events)
        .catch(() => []);
      const m5 = events.filter((e) => e.magnitude >= 5);
      const score = scores.get(region.slug);
      return {
        slug: region.slug,
        name: region.name,
        typeLabel: regionType(region.type),
        island: islandOf(region.latitude, region.longitude),
        score: score?.composite_score ?? null,
        tier: score?.activity_tier ?? null,
        m5: m5.length,
        largest: events.reduce<number | null>((m, e) => (m == null || e.magnitude > m ? e.magnitude : m), null),
        spikes: m5
          .map((e): [number, number, number] => [
            Math.round(((new Date(e.event_time).getTime() - DOMAIN_START) / span) * 1000) / 1000,
            e.magnitude,
            BAND_INDEX[depthBand(e.depth_km)],
          ])
          .filter(([x]) => x >= 0)
          .sort((a, b) => a[1] - b[1]),
      };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Wilayah"
        title={`Jelajahi ${rows.length} wilayah`}
        subtitle="Skor aktivitas gempa historis tiap kabupaten dan kota yang sudah diskor, dengan rekaman gempa M5+ dalam radius 100 km sejak 1970. Tinggi garis = magnitudo, warna = kedalaman."
      />
      <RegionIndex rows={rows} />
      <SourceAttribution />
    </div>
  );
}

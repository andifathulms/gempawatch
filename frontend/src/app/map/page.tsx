import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/meta";
import type { EarthquakeEvent, GeoFeatureCollection, LeaderboardRow, TsunamiZone } from "@/lib/types";
import type { RegionScorePoint } from "@/components/map/HazardMap";
import { DynamicHazardMap } from "@/components/map/DynamicHazardMap";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "Peta Bahaya & Sesar Indonesia",
  description: "Peta interaktif sesar aktif, gempa terkini, dan zona risiko tsunami historis di seluruh Indonesia.",
  path: "/map",
});

const EMPTY_FC: GeoFeatureCollection = { type: "FeatureCollection", features: [] };

export default async function MapPage() {
  // Layers fail independently — a fault-line outage should not take the whole
  // map down, it should just leave that toggle showing zero objects.
  const [faults, events, zones, regions, desc, asc] = await Promise.all([
    api.faults().catch(() => EMPTY_FC),
    api
      .liveEvents()
      .then((r) => r.results)
      .catch(() => [] as EarthquakeEvent[]),
    api
      .coastalZones()
      .then((r) => r.zones)
      .catch(() => [] as TsunamiZone[]),
    api
      .regions()
      .then((r) => r.results)
      .catch(() => []),
    api.leaderboard(50, "desc").then((r) => r.results).catch(() => [] as LeaderboardRow[]),
    api.leaderboard(50, "asc").then((r) => r.results).catch(() => [] as LeaderboardRow[]),
  ]);

  // "Skor per wilayah" layer: every scored region at its centroid.
  const scoreBySlug = new Map([...desc, ...asc].map((r) => [r.slug, r]));
  const regionScores: RegionScorePoint[] = regions.flatMap((r) => {
    const s = scoreBySlug.get(r.slug);
    return s
      ? [{ slug: r.slug, name: r.name, latitude: r.latitude, longitude: r.longitude, score: s.composite_score, tier: s.activity_tier }]
      : [];
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Peta bahaya"
        title="Lima puluh tahun gempa, di satu peta"
        subtitle="Indonesia duduk di pertemuan tiga lempeng besar. Putar rekaman sejak 1970 untuk melihat busur gempa terbentuk, lalu tumpuk sesar aktif, gempa terkini, skor wilayah, dan riwayat tsunami."
        action={
          <ButtonLink href="/" variant="secondary">
            Cek titik saya →
          </ButtonLink>
        }
      />

      {/*
        The only route where a map should fill the viewport (DESIGN.md §9) —
        broken out of <main>'s max-w-6xl via the left/right/-mx-[50vw]
        full-bleed technique, rather than left inside a bounded Card fighting
        the thing this page exists to do.
      */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <div className="h-[calc(100vh-5rem)] min-h-[420px]">
          <DynamicHazardMap faults={faults} events={events} zones={zones} regions={regionScores} />
        </div>
      </div>

      <section aria-labelledby="cara-membaca" className="pt-6">
        <h2 id="cara-membaca" className="text-fluid-3 font-extrabold tracking-tight">
          Cara membaca peta ini
        </h2>
        <div className="mt-5 grid gap-8 text-fluid-00 leading-relaxed text-ink-2 sm:grid-cols-3">
          <p className="border-t-2 border-ink pt-3">
            <strong className="text-ink">Sesar aktif</strong> adalah retakan kerak bumi tempat energi
            gempa dilepaskan. Dekat dengan sesar berarti guncangan cenderung lebih kuat pada magnitudo
            yang sama — bukan berarti gempa pasti terjadi.
          </p>
          <p className="border-t-2 border-ink pt-3">
            <strong className="text-ink">Kedalaman</strong> menentukan seberapa keras guncangan sampai
            ke permukaan. Gempa dangkal (&lt;30&nbsp;km) pada magnitudo sedang bisa lebih merusak
            daripada gempa dalam bermagnitudo besar.
          </p>
          <p className="border-t-2 border-ink pt-3">
            <strong className="text-ink">Zona tsunami</strong> menandai wilayah pesisir dengan riwayat
            gempa pemicu tsunami. Ini indikator pola historis — peringatan tsunami resmi hanya berasal
            dari BMKG.
          </p>
        </div>
      </section>
    </div>
  );
}

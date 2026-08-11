import { api } from "@/lib/api";
import type { LeaderboardRow } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { RegionSearch } from "@/components/discover/RegionSearch";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

export const revalidate = 3600;

export const metadata = {
  title: "Jelajahi Wilayah — Peringkat Risiko Gempa | GempaWatch",
  description:
    "Cari kota/kabupaten dan lihat peringkat wilayah paling aktif secara seismik di Indonesia.",
};

/** The four weights behind the score, stated where people meet the ranking. */
const WEIGHTS = [
  { label: "Frekuensi gempa M4+ per tahun", max: 40 },
  { label: "Magnitudo terbesar tercatat", max: 30 },
  { label: "Proporsi gempa dangkal (<70 km)", max: 15 },
  { label: "Kedekatan sesar aktif", max: 15 },
];

export default async function ExplorePage() {
  let top: LeaderboardRow[] = [];
  let bottom: LeaderboardRow[] = [];
  try {
    [top, bottom] = await Promise.all([
      api.leaderboard(15, "desc").then((r) => r.results),
      api.leaderboard(5, "asc").then((r) => r.results),
    ]);
  } catch {
    /* optional */
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jelajahi"
        title="Wilayah mana yang paling aktif?"
        subtitle="Cari lokasimu, atau telusuri peringkat aktivitas seismik nasional. Skor menimbang frekuensi, magnitudo, kedalaman, dan kedekatan sesar dalam radius 100 km."
      >
        <RegionSearch />
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card
          title="15 wilayah paling aktif"
          subtitle="Panjang batang menunjukkan skor relatif terhadap peringkat teratas."
          className="lg:col-span-2"
          footer={
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/compare" variant="secondary" size="sm">
                Bandingkan dua wilayah →
              </ButtonLink>
              <ButtonLink href="/risk-check" variant="ghost" size="sm">
                Atau cek titik persismu
              </ButtonLink>
            </div>
          }
        >
          <Leaderboard rows={top} />
        </Card>

        <div className="space-y-5">
          <Card
            title="Aktivitas terendah"
            subtitle="Konteks untuk ujung lain skala yang sama."
          >
            <Leaderboard rows={bottom} variant="compact" />
          </Card>

          <Card title="Bagaimana skor dihitung">
            <ul className="space-y-2.5">
              {WEIGHTS.map((w) => (
                <li key={w.label}>
                  <div className="flex items-baseline justify-between gap-3 text-fluid-00">
                    <span className="text-text-secondary">{w.label}</span>
                    <span className="shrink-0 font-mono text-fluid-000 tabular-nums text-text-muted">
                      maks {w.max}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-earth-border">
                    <div
                      className="h-full origin-left animate-draw-in rounded-full bg-seismic-orange/70"
                      style={{ width: `${w.max}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-fluid-000 leading-relaxed text-text-muted">
              Jumlah kejadian dihitung dalam radius tetap dan tidak dinormalisasi
              terhadap luas wilayah maupun populasi — dua wilayah berskor sama belum
              tentu sebanding paparannya. Gunakan persentil untuk konteks relatif.
            </p>
          </Card>
        </div>
      </div>

      <SourceAttribution />
    </div>
  );
}

import Link from "next/link";
import { api } from "@/lib/api";
import type { LeaderboardRow } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegionSearch } from "@/components/discover/RegionSearch";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

export const revalidate = 3600;

export const metadata = {
  title: "Jelajahi Wilayah — Peringkat Risiko Gempa | GempaWatch",
  description:
    "Cari kota/kabupaten dan lihat peringkat wilayah paling aktif secara seismik di Indonesia.",
};

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
        title="Jelajahi Wilayah"
        subtitle="Cari lokasimu, atau lihat wilayah paling aktif secara seismik. Skor menimbang frekuensi, magnitudo, kedalaman, dan kedekatan sesar."
      >
        <RegionSearch />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Wilayah Paling Aktif" className="lg:col-span-2">
          <Leaderboard rows={top} />
          <Link
            href="/compare"
            className="mt-4 inline-block text-sm text-seismic-orange hover:brightness-110"
          >
            Bandingkan dua wilayah →
          </Link>
        </Card>

        <Card title="Aktivitas Terendah">
          <Leaderboard rows={bottom} />
        </Card>
      </div>

      <SourceAttribution />
    </div>
  );
}

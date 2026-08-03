import Link from "next/link";
import { api } from "@/lib/api";
import type { EarthquakeEvent, HistoricalDisaster, LeaderboardRow } from "@/lib/types";
import { DynamicLiveMap } from "@/components/map/DynamicLiveMap";
import { DepthLegend } from "@/components/map/DepthLegend";
import { EventList } from "@/components/map/EventList";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { RegionSearch } from "@/components/discover/RegionSearch";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { magnitude, num, shortDate } from "@/lib/format";

export const revalidate = 300; // 5 min, matching BMKG cadence

function daySummary(events: EarthquakeEvent[]) {
  if (events.length === 0) {
    return { total: 0, largest: null as EarthquakeEvent | null, felt: 0, shallow: 0 };
  }
  return {
    total: events.length,
    largest: events.reduce((a, b) => (b.magnitude > a.magnitude ? b : a)),
    felt: events.filter((e) => e.felt_reports).length,
    shallow: events.filter((e) => e.depth_km < 30).length,
  };
}

export default async function HomePage() {
  // Each block degrades on its own — a leaderboard outage should not cost the
  // reader the live map, and vice versa.
  const [events, top, disasters] = await Promise.all([
    api
      .liveEvents()
      .then((d) => d.results)
      .catch(() => null),
    api
      .leaderboard(5, "desc")
      .then((r) => r.results)
      .catch(() => [] as LeaderboardRow[]),
    api.disasterTimeline().catch(() => [] as HistoricalDisaster[]),
  ]);

  const loadFailed = events === null;
  const list = events ?? [];
  const summary = daySummary(list);

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------
          Hero. The product answers "how exposed is my area?", so the search
          field *is* the hero — not a banner with a button underneath it.
         ------------------------------------------------------------------ */}
      <section className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-earth-border bg-earth-surface px-5 py-8 shadow-raised sm:px-8 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-seismic-orange/[0.07] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 26px, rgba(232,116,59,0.045) 26px 27px)",
            maskImage: "linear-gradient(to left, black, transparent 55%)",
            WebkitMaskImage: "linear-gradient(to left, black, transparent 55%)",
          }}
        />

        <div className="relative flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-earth-border bg-earth-dark/70 px-3 py-1.5 text-xs text-text-secondary">
            <span className="relative inline-flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full ${loadFailed ? "bg-risk-amber" : "bg-risk-green"}`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${loadFailed ? "bg-risk-amber" : "bg-risk-green"}`}
              />
            </span>
            {loadFailed
              ? "Data langsung sementara tidak tersedia"
              : `${num(summary.total)} gempa tercatat dalam 24 jam terakhir`}
          </span>

          <div className="max-w-3xl">
            <h1 className="text-fluid-5 font-bold tracking-tight">
              Seberapa rawan gempa{" "}
              <span className="text-seismic-orange">lokasi kamu?</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
              Lebih dari 50 tahun catatan seismik BMKG dan USGS, dibaca sebagai
              pola untuk wilayahmu sendiri — bukan sekadar daftar gempa terbaru,
              dan bukan ramalan.
            </p>
          </div>

          <div className="max-w-xl">
            <RegionSearch size="lg" />
            <p className="mt-2.5 text-xs text-text-muted">
              Ketik nama kabupaten/kota, atau{" "}
              <Link
                href="/risk-check"
                className="font-medium text-seismic-bright underline underline-offset-2 hover:brightness-110"
              >
                pakai lokasi GPS-mu
              </Link>{" "}
              untuk laporan titik yang presisi.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/risk-check" size="lg">
              Cek Risiko Saya →
            </ButtonLink>
            <ButtonLink href="/explore" variant="secondary" size="lg">
              Peringkat wilayah
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Headline figures for the last 24 hours. */}
      <section aria-label="Ringkasan 24 jam terakhir">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Gempa tercatat (24 jam)"
            value={loadFailed ? "—" : num(summary.total)}
            tone="accent"
          />
          <StatTile
            label="Magnitudo terbesar"
            value={summary.largest ? magnitude(summary.largest.magnitude) : "—"}
          />
          <StatTile
            label="Gempa dangkal (<30 km)"
            value={loadFailed ? "—" : num(summary.shallow)}
            hint="Gempa dangkal umumnya paling terasa dan paling merusak di permukaan."
          />
          <StatTile
            label="Dilaporkan dirasakan"
            value={loadFailed ? "—" : num(summary.felt)}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Map and feed side by side. They answer the same question in two
          registers — where, and what/when — so splitting them across sections
          made the reader scroll between halves of one thought.
         ------------------------------------------------------------------ */}
      <section className="grid gap-5 lg:grid-cols-5">
        <Card
          title="Peta gempa — 24 jam terakhir"
          className="lg:col-span-3"
          action={
            <Link
              href="/map"
              className="text-xs text-text-secondary transition-colors hover:text-seismic-bright"
            >
              Peta bahaya lengkap →
            </Link>
          }
          footer={
            <div className="space-y-2">
              <DepthLegend />
              <SourceAttribution variant="inline" />
            </div>
          }
        >
          {loadFailed && (
            <div className="mb-3">
              <EmptyState
                tone="warning"
                title="Gagal memuat data gempa langsung."
                description="Peta ditampilkan tanpa kejadian terbaru. Muat ulang halaman untuk mencoba lagi."
              />
            </div>
          )}
          <DynamicLiveMap events={list} />
        </Card>

        <Card
          title="Gempa terkini"
          className="lg:col-span-2"
          subtitle="Diperbarui mengikuti kadensi BMKG (±5 menit)."
        >
          <div className="max-h-[420px] overflow-y-auto pr-1">
            {loadFailed ? (
              <EmptyState
                tone="warning"
                title="Data tidak tersedia saat ini."
                description="Coba muat ulang halaman dalam beberapa saat."
              />
            ) : (
              <EventList events={list} />
            )}
          </div>
        </Card>
      </section>

      {/* Discovery + history: two ways to leave the homepage with something. */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Wilayah paling aktif"
          subtitle="Skor 0–100 menimbang frekuensi, magnitudo, kedalaman, dan kedekatan sesar."
          action={
            <Link
              href="/explore"
              className="text-xs text-text-secondary transition-colors hover:text-seismic-bright"
            >
              Lihat semua →
            </Link>
          }
        >
          <Leaderboard rows={top} variant="compact" />
        </Card>

        <Card
          title="Memori bencana"
          subtitle="Kejadian yang membentuk kesadaran kebencanaan Indonesia."
          action={
            <Link
              href="/timeline"
              className="text-xs text-text-secondary transition-colors hover:text-seismic-bright"
            >
              Linimasa lengkap →
            </Link>
          }
        >
          {disasters.length === 0 ? (
            <EmptyState title="Arsip bencana belum tersedia." />
          ) : (
            <ul className="divide-y divide-earth-border/70">
              {disasters.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-baseline gap-3 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-text-muted">
                    {shortDate(d.event_date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                    {d.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-seismic-bright">
                    {magnitude(d.magnitude)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

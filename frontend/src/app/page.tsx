import Link from "next/link";
import { api } from "@/lib/api";
import type { EarthquakeEvent } from "@/lib/types";
import { DynamicLiveMap } from "@/components/map/DynamicLiveMap";
import { EventList } from "@/components/map/EventList";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { RegionSearch } from "@/components/discover/RegionSearch";

export const revalidate = 300; // 5 min, matching BMKG cadence

function weekSummary(events: EarthquakeEvent[]) {
  if (events.length === 0) {
    return { total: 0, largest: null as EarthquakeEvent | null, felt: 0 };
  }
  const largest = events.reduce((a, b) => (b.magnitude > a.magnitude ? b : a));
  const felt = events.filter((e) => e.felt_reports).length;
  return { total: events.length, largest, felt };
}

export default async function HomePage() {
  let events: EarthquakeEvent[] = [];
  try {
    const data = await api.liveEvents();
    events = data.results;
  } catch {
    events = [];
  }
  const summary = weekSummary(events);

  return (
    <div className="space-y-6">
      <section className="animate-fade-in-up relative overflow-hidden rounded-2xl border border-earth-border bg-gradient-to-br from-earth-surface to-earth-dark p-6 shadow-md sm:p-8">
        {/* Subtle seismic-wave motif in the corner — decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-seismic-orange/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-earth-border bg-earth-dark/60 px-3 py-1 text-xs text-text-secondary">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-risk-green" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-green" />
            </span>
            {summary.total} gempa tercatat dalam 24 jam terakhir
          </span>

          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Seberapa rawan gempa{" "}
              <span className="text-seismic-orange">lokasi kamu?</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-secondary sm:text-base">
              Intelijen risiko gempa Indonesia — menggabungkan data langsung BMKG dan
              catatan seismik historis USGS. Bukan prediksi, melainkan pola historis.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/risk-check"
              className="inline-flex items-center justify-center rounded-lg bg-seismic-orange px-5 py-2.5 text-sm font-semibold text-earth-dark shadow-glow transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Cek Risiko Saya →
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-lg border border-earth-border bg-earth-dark/40 px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-seismic-orange hover:text-text-primary"
            >
              Lihat Peta Bahaya
            </Link>
          </div>

          <div className="max-w-xl">
            <RegionSearch />
          </div>
        </div>
      </section>

      <Card
        title="Peta Gempa — 24 Jam Terakhir"
        action={
          <Link
            href="/map"
            className="text-xs text-text-secondary transition-colors hover:text-seismic-orange"
          >
            Peta lengkap →
          </Link>
        }
      >
        <DynamicLiveMap events={events} />
        <SourceAttribution className="mt-3" />
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Gempa Terkini" className="md:col-span-2">
          <div className="max-h-[380px] overflow-y-auto pr-1">
            <EventList events={events} />
          </div>
        </Card>

        <Card title="Pekan Ini dalam Angka">
          <Stat label="Total gempa (24 jam)" value={summary.total} accent />
          <Stat
            label="Terbesar"
            value={
              summary.largest
                ? `M${summary.largest.magnitude.toFixed(1)}`
                : "—"
            }
          />
          <Stat
            label="Lokasi terbesar"
            value={
              summary.largest
                ? summary.largest.location_description.slice(0, 22)
                : "—"
            }
          />
          <Stat label="Laporan dirasakan" value={summary.felt} />
          <Link
            href="/timeline"
            className="mt-4 block rounded-lg border border-earth-border px-3 py-2 text-center text-sm text-text-secondary hover:border-seismic-orange hover:text-seismic-orange"
          >
            Lihat Sejarah Bencana →
          </Link>
        </Card>
      </div>
    </div>
  );
}

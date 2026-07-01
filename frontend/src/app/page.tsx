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
      <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Seberapa rawan gempa lokasi kamu?
          </h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            Intelijen risiko gempa Indonesia — menggabungkan data langsung BMKG dan
            catatan seismik historis USGS. Bukan prediksi, melainkan pola historis.
          </p>
        </div>
        <Link
          href="/risk-check"
          className="shrink-0 rounded-lg bg-seismic-orange px-4 py-2.5 text-sm font-semibold text-earth-dark hover:brightness-110"
        >
          Cek Risiko Saya →
        </Link>
      </section>

      <RegionSearch />

      <Card title="Peta Gempa — 24 Jam Terakhir">
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

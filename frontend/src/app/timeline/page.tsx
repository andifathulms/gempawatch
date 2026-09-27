import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/meta";
import type { HistoricalDisaster } from "@/lib/types";
import { DisasterTimeline, type DisasterFragment } from "@/components/timeline/DisasterTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
import { FactRow } from "@/components/risk/VerdictBand";
import { NationalTrace } from "@/components/timeline/NationalTrace";
import { ButtonLink } from "@/components/ui/Button";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { magnitude, num } from "@/lib/format";

export const revalidate = 86400;

export const metadata = pageMetadata({
  title: "Sejarah Bencana Gempa Indonesia",
  description: "Arsip gempa dan tsunami besar Indonesia: Aceh 2004, Yogyakarta 2006, Palu 2018, dan lainnya.",
  path: "/timeline",
});

/** "Gempa, Tsunami & Likuefaksi Palu" → "Palu", for the trace's flags. */
function shortName(name: string): string {
  return name
    .replace(/^Gempa(,? (dan|&) Tsunami| & Tsunami|, Tsunami & Likuefaksi)?\s*/i, "")
    .replace(/\s*\(.*\)$/, "")
    .split(/[/–-]/)[0]
    .trim();
}

export default async function TimelinePage() {
  let disasters: HistoricalDisaster[] = [];
  try {
    disasters = await api.disasterTimeline();
  } catch {
    disasters = [];
  }

  /*
   * Each entry's regional context (DESIGN.md §9) — the curated archive is
   * small (a handful of entries), so resolving a nearest region and its
   * timeline per disaster, in parallel, at build time, costs nothing a
   * reader waits on. A resolution failure degrades that one entry's fragment
   * silently rather than the page — DisasterEntry just doesn't render one.
   */
  const fragments: Record<number, DisasterFragment | null> = {};
  await Promise.all(
    disasters.map(async (d) => {
      try {
        const region = await api.nearestRegion(d.latitude, d.longitude);
        const timeline = await api.regionTimeline(region.slug);
        fragments[d.id] = {
          regionName: region.name,
          events: timeline.events.map((e) => ({
            event_time: e.event_time,
            magnitude: e.magnitude,
            depth_km: e.depth_km,
            source: e.source,
          })),
        };
      } catch {
        fragments[d.id] = null;
      }
    }),
  );

  const casualties = disasters.reduce((sum, d) => sum + (d.casualties ?? 0), 0);
  const largest = disasters.reduce<number | null>(
    (max, d) => (d.magnitude != null && (max == null || d.magnitude > max) ? d.magnitude : max),
    null,
  );
  const years = disasters
    .map((d) => new Date(d.event_date).getFullYear())
    .filter((y) => Number.isFinite(y));
  const span =
    years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : "—";

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Memori bencana"
        title="Yang sudah terjadi, dan apa yang kita pelajari"
        subtitle="Arsip gempa dan tsunami besar yang membentuk kesadaran kebencanaan Indonesia. Halaman ini bukan peringatan — ini catatan, supaya kesiapsiagaan hari ini punya pijakan."
        action={
          <ButtonLink href="/" variant="secondary">
            Cek risiko lokasiku →
          </ButtonLink>
        }
      />

      {disasters.length > 0 && (
        <>
          <section aria-labelledby="rekaman-nasional" className="space-y-4">
            <h2 id="rekaman-nasional" className="text-fluid-3 font-extrabold tracking-tight">
              Rekaman nasional
            </h2>
            <NationalTrace
              flags={disasters.map((d) => ({ id: d.id, label: shortName(d.name), date: d.event_date, weight: d.casualties ?? 0 }))}
            />
          </section>

          {/* Plain figures, no tier colour: a death toll is a memorial, not a
              risk indicator, and red belongs to the risk tier (DESIGN.md §3.3). */}
          <FactRow
            facts={[
              { value: num(disasters.length), label: "kejadian terdokumentasi" },
              { value: span, label: "rentang tahun" },
              { value: magnitude(largest), label: "magnitudo terbesar" },
              {
                value: num(casualties),
                label: "korban jiwa tercatat — jumlah dari arsip ini, bukan total nasional",
              },
            ]}
          />
        </>
      )}

      <DisasterTimeline disasters={disasters} fragments={fragments} />

      {/* The source set is correct — every entry in the archive cites USGS and
          one also cites BMKG — but crediting only the two feeds implied they
          supply the whole entry, including the casualty and displacement
          figures. Those come from the curation, not from either API, and that
          distinction matters on a page whose largest numbers are death tolls. */}
      <div className="space-y-2">
        <SourceAttribution sources={["BMKG", "USGS"]} />
        <p className="text-fluid-000 leading-relaxed text-ink-3">
          Magnitudo dan episentrum tiap kejadian berasal dari katalog di atas.
          Angka korban jiwa dan pengungsi dikurasi manual dari catatan publik
          per kejadian, bukan dari feed BMKG maupun USGS, dan dapat berbeda
          antar sumber resmi.
        </p>
      </div>
    </div>
  );
}

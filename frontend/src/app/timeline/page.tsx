import { api } from "@/lib/api";
import type { HistoricalDisaster } from "@/lib/types";
import { DisasterTimeline } from "@/components/timeline/DisasterTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { magnitude, num } from "@/lib/format";

export const revalidate = 86400;

export const metadata = {
  title: "Sejarah Bencana Gempa Indonesia — GempaWatch",
  description:
    "Arsip gempa dan tsunami besar Indonesia: Aceh 2004, Yogyakarta 2006, Palu 2018, dan lainnya.",
};

export default async function TimelinePage() {
  let disasters: HistoricalDisaster[] = [];
  try {
    disasters = await api.disasterTimeline();
  } catch {
    disasters = [];
  }

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Memori bencana"
        title="Yang sudah terjadi, dan apa yang kita pelajari"
        subtitle="Arsip gempa dan tsunami besar yang membentuk kesadaran kebencanaan Indonesia. Halaman ini bukan peringatan — ini catatan, supaya kesiapsiagaan hari ini punya pijakan."
        action={
          <ButtonLink href="/risk-check" variant="secondary">
            Cek risiko lokasiku →
          </ButtonLink>
        }
      />

      {disasters.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Kejadian terdokumentasi" value={num(disasters.length)} />
          <StatTile label="Rentang tahun" value={span} />
          <StatTile label="Magnitudo terbesar" value={magnitude(largest)} tone="accent" />
          {/* Default tone, not `danger`. Red is the site's high-risk signal;
              a memorial figure is not a risk indicator, and the PRD asks for
              calm authority rather than a doom-scrolling disaster app. The
              number is grave enough without being coloured like an alert. */}
          <StatTile
            label="Total korban jiwa tercatat"
            value={num(casualties)}
            hint="Penjumlahan angka korban dari kejadian yang terdokumentasi di arsip ini — bukan total nasional."
          />
        </div>
      )}

      <DisasterTimeline disasters={disasters} />

      {/* The source set is correct — every entry in the archive cites USGS and
          one also cites BMKG — but crediting only the two feeds implied they
          supply the whole entry, including the casualty and displacement
          figures. Those come from the curation, not from either API, and that
          distinction matters on a page whose largest numbers are death tolls. */}
      <div className="space-y-2">
        <SourceAttribution sources={["BMKG", "USGS"]} />
        <p className="text-fluid-000 leading-relaxed text-text-muted">
          Magnitudo dan episentrum tiap kejadian berasal dari katalog di atas.
          Angka korban jiwa dan pengungsi dikurasi manual dari catatan publik
          per kejadian, bukan dari feed BMKG maupun USGS, dan dapat berbeda
          antar sumber resmi.
        </p>
      </div>
    </div>
  );
}

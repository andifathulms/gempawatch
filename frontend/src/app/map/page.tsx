import { api } from "@/lib/api";
import type { EarthquakeEvent, GeoFeatureCollection, TsunamiZone } from "@/lib/types";
import { DynamicHazardMap } from "@/components/map/DynamicHazardMap";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

export const revalidate = 3600;

export const metadata = {
  title: "Peta Bahaya & Sesar Indonesia — GempaWatch",
  description:
    "Peta interaktif sesar aktif, gempa terkini, dan zona risiko tsunami historis di seluruh Indonesia.",
};

const EMPTY_FC: GeoFeatureCollection = { type: "FeatureCollection", features: [] };

export default async function MapPage() {
  // Layers fail independently — a fault-line outage should not take the whole
  // map down, it should just leave that toggle showing zero objects.
  const [faults, events, zones] = await Promise.all([
    api.faults().catch(() => EMPTY_FC),
    api
      .liveEvents()
      .then((r) => r.results)
      .catch(() => [] as EarthquakeEvent[]),
    api
      .coastalZones()
      .then((r) => r.zones)
      .catch(() => [] as TsunamiZone[]),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Peta bahaya"
        title="Sesar, gempa, dan zona tsunami"
        subtitle="Indonesia duduk di pertemuan tiga lempeng besar. Nyalakan atau matikan tiap lapisan untuk melihat bagaimana sesar aktif, kegempaan terkini, dan riwayat tsunami saling bertumpuk di wilayahmu."
        action={
          <ButtonLink href="/risk-check" variant="secondary">
            Cek titik saya →
          </ButtonLink>
        }
      />

      <Card>
        <DynamicHazardMap faults={faults} events={events} zones={zones} />
      </Card>

      <Card title="Cara membaca peta ini">
        <div className="grid gap-4 text-fluid-00 leading-relaxed text-text-secondary sm:grid-cols-3">
          <p>
            <strong className="text-text-primary">Sesar aktif</strong> adalah
            retakan kerak bumi tempat energi gempa dilepaskan. Dekat dengan sesar
            berarti guncangan cenderung lebih kuat pada magnitudo yang sama —
            bukan berarti gempa pasti terjadi.
          </p>
          <p>
            <strong className="text-text-primary">Kedalaman</strong> menentukan
            seberapa keras guncangan sampai ke permukaan. Gempa dangkal
            (&lt;30&nbsp;km) pada magnitudo sedang bisa lebih merusak daripada
            gempa dalam bermagnitudo besar.
          </p>
          <p>
            <strong className="text-text-primary">Zona tsunami</strong> menandai
            wilayah pesisir dengan riwayat gempa pemicu tsunami. Ini indikator
            pola historis — peringatan tsunami resmi hanya berasal dari BMKG.
          </p>
        </div>
      </Card>
    </div>
  );
}

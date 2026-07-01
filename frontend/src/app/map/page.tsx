import { api } from "@/lib/api";
import type { EarthquakeEvent, GeoFeatureCollection, TsunamiZone } from "@/lib/types";
import { DynamicHazardMap } from "@/components/map/DynamicHazardMap";
import { Card } from "@/components/ui/Card";

export const revalidate = 3600;

const EMPTY_FC: GeoFeatureCollection = { type: "FeatureCollection", features: [] };

export default async function MapPage() {
  let faults: GeoFeatureCollection = EMPTY_FC;
  let events: EarthquakeEvent[] = [];
  let zones: TsunamiZone[] = [];

  try {
    faults = await api.faults();
  } catch {
    /* faults optional */
  }
  try {
    events = (await api.liveEvents()).results;
  } catch {
    /* events optional */
  }
  try {
    zones = (await api.coastalZones()).zones;
  } catch {
    /* zones optional */
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Peta Bahaya & Sesar</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sesar aktif, kepadatan gempa historis, dan zona risiko tsunami. Aktifkan
          atau matikan lapisan sesuai kebutuhan.
        </p>
      </div>

      <Card>
        <DynamicHazardMap faults={faults} events={events} zones={zones} />
      </Card>
    </div>
  );
}

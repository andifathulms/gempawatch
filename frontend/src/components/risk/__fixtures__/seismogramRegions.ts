/**
 * Three real per-region event sets, pulled verbatim from the static export
 * already checked into `frontend/public/api/regions/*\/timeline/index.json`
 * (`event_time` / `magnitude` / `depth_km` / `source` only — the fields this
 * component reads). Not synthetic: these are the actual profiles DESIGN.md
 * §10 step 1 asks for —
 *
 *   - `active`   Kota Gunungsitoli (1,640 events) — dense, sustained record.
 *   - `dominant` Sikka (432 events) — one M7.8 (1992) far above everything else.
 *   - `quiet`    Kota Semarang (28 events) — a single M5.2 in 1979, otherwise M4s.
 */
import seismogramRegions from "./seismogramRegions.json";
import type { SeismogramEvent } from "../../../lib/seismogram";

export interface SeismogramRegionFixture {
  regionName: string;
  slug: string;
  events: SeismogramEvent[];
}

export const SEISMOGRAM_REGION_FIXTURES = seismogramRegions as Record<
  "active" | "dominant" | "quiet",
  SeismogramRegionFixture
>;

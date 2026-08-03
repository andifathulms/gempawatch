/**
 * Loads and caches the static dataset the client-side risk engine runs on.
 *
 * Events live in parallel typed arrays rather than an array of objects: at
 * ~70k events that is roughly 1.1 MB of packed memory instead of tens of MB of
 * JS objects, and it keeps the radius scans cache-friendly enough to run on a
 * mid-range phone without blocking the main thread noticeably.
 *
 * The fetcher is injectable so the Node test suite can read the same files off
 * disk that the browser fetches over HTTP.
 */
export interface EventArrays {
  count: number;
  lon: Float64Array;
  lat: Float64Array;
  // Float64 rather than Float32 throughout: magnitudes carry one decimal and
  // are compared for equality against Django's values, and Float32 cannot hold
  // 6.6 exactly (it becomes 6.599999904632568). The memory saving is not worth
  // reintroducing a class of mismatch the fixtures exist to catch.
  mag: Float64Array;
  depth: Float64Array; // NaN when the source had no depth
  year: Int16Array;
}

export interface RegionRow {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_coastal: boolean;
  latitude: number;
  longitude: number;
}

export interface FaultFeature {
  id: number;
  name: string;
  geometry: { type: string; coordinates: unknown };
}

export interface EngineConstants {
  risk_check_radius_km: number;
  score_radius_km: number;
  tsunami_search_radius_km: number;
  tsunami_max_depth_km: number;
  tsunami_min_magnitude: number;
  tsunami_high_threshold: number;
  tsunami_moderate_threshold: number;
}

export interface EngineData {
  events: EventArrays;
  regions: RegionRow[];
  faults: FaultFeature[];
  storedScores: number[];
  constants: EngineConstants;
}

export type Fetcher = (path: string) => Promise<string>;

/** Parse the exported events.csv into parallel typed arrays. */
export function parseEventsCsv(text: string): EventArrays {
  const lines = text.split("\n");
  // Header + trailing newline; allocate optimistically and trim at the end.
  const capacity = Math.max(0, lines.length - 1);
  const lon = new Float64Array(capacity);
  const lat = new Float64Array(capacity);
  const mag = new Float64Array(capacity);
  const depth = new Float64Array(capacity);
  const year = new Int16Array(capacity);

  let n = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 5) continue;
    lon[n] = +parts[0];
    lat[n] = +parts[1];
    mag[n] = +parts[2];
    depth[n] = parts[3] === "" ? Number.NaN : +parts[3];
    year[n] = +parts[4];
    n++;
  }

  return {
    count: n,
    lon: lon.subarray(0, n),
    lat: lat.subarray(0, n),
    mag: mag.subarray(0, n),
    depth: depth.subarray(0, n),
    year: year.subarray(0, n),
  };
}

/** Build the engine dataset from four static files. */
export async function loadEngineData(fetcher: Fetcher): Promise<EngineData> {
  const [eventsCsv, regionsJson, faultsJson, metaJson] = await Promise.all([
    fetcher("/data/events.csv"),
    fetcher("/api/regions/index.json"),
    fetcher("/api/faults/index.json"),
    fetcher("/data/engine-meta.json"),
  ]);

  const regionsPayload = JSON.parse(regionsJson);
  const faultsPayload = JSON.parse(faultsJson);
  const meta = JSON.parse(metaJson);

  const regions: RegionRow[] = regionsPayload.results ?? regionsPayload;

  const faults: FaultFeature[] = (faultsPayload.features ?? []).map(
    (f: { id?: number; properties?: Record<string, unknown>; geometry: FaultFeature["geometry"] }) => ({
      id: (f.id ?? f.properties?.id) as number,
      name: (f.properties?.name ?? "") as string,
      geometry: f.geometry,
    }),
  );

  return {
    events: parseEventsCsv(eventsCsv),
    regions,
    faults,
    storedScores: meta.stored_scores ?? [],
    constants: meta.constants,
  };
}

/**
 * HTTP fetcher. Takes a resolver rather than a bare prefix so the caller can
 * point at the deployment's base path in the browser and at the build-time
 * loopback server during static generation.
 */
export function createHttpFetcher(resolve: ((path: string) => string) | string = ""): Fetcher {
  const toUrl =
    typeof resolve === "string" ? (path: string) => `${resolve}${path}` : resolve;
  return async (path: string) => {
    const res = await fetch(toUrl(path));
    if (!res.ok) {
      throw new Error(`engine dataset ${path} failed: ${res.status}`);
    }
    return res.text();
  };
}

let cached: Promise<EngineData> | null = null;

/**
 * Load once per page session. The dataset is immutable for a given deploy, so
 * repeated risk checks reuse the same parsed arrays.
 */
export function getEngineData(fetcher: Fetcher): Promise<EngineData> {
  if (!cached) {
    cached = loadEngineData(fetcher).catch((err) => {
      cached = null; // let a later attempt retry instead of caching the failure
      throw err;
    });
  }
  return cached;
}

export function resetEngineDataCache(): void {
  cached = null;
}

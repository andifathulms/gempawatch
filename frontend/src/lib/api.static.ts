/**
 * Static API client — reads the prebuilt tree produced by
 * `manage.py export_static` instead of calling Django.
 *
 * Three kinds of method live here:
 *
 *   1. Straight file reads. The export mirrors the live URL paths, so these are
 *      the same request with `index.json` on the end.
 *   2. Locally recomposed. Endpoints whose query parameters only slice or join
 *      data already present in the export (search, leaderboard, compare).
 *   3. Engine-backed. Endpoints that need real spatial computation over the
 *      event set — `nearestRegion` and `riskCheck` — which run the TypeScript
 *      port in src/lib/engine, verified against Django by golden fixtures.
 *
 * `api.live.ts` remains the source of truth for endpoint shapes; the GempaApi
 * type makes this file fail to compile if it drifts.
 */
import type { GempaApi, Paginated } from "./api.live";
import { createHttpFetcher, getEngineData } from "./engine/dataset";
import { buildPointRiskReport, nearestRegion as engineNearestRegion } from "./engine/report";
import type {
  AdminRegion,
  EarthquakeEvent,
  GeoFeatureCollection,
  HistoricalDisaster,
  LeaderboardRow,
  RegionRiskProfile,
  RegionTimeline,
  RiskCheckReport,
  TsunamiZone,
} from "./types";

// Set at build time by next.config.mjs so asset URLs work under the
// /<repo> path GitHub Pages serves a project site from.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Static generation runs these same calls in Node, where a root-relative URL
 * has nothing to resolve against. scripts/build-static.mjs serves the export
 * tree over loopback for the duration of the build and passes its origin here.
 * In the browser this is empty and the base path is used instead.
 */
const BUILD_ORIGIN = process.env.STATIC_DATA_ORIGIN ?? "";

export function dataUrl(path: string): string {
  if (typeof window === "undefined" && BUILD_ORIGIN) {
    // The build server serves the export at its root, without the base path.
    return `${BUILD_ORIGIN}${path}`;
  }
  return `${BASE_PATH}${path}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(dataUrl(`/api${path}`), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`static API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const fetcher = createHttpFetcher(dataUrl);
const engine = () => getEngineData(fetcher);

/**
 * Endpoints the export deliberately does not cover. Per-event detail would be
 * ~70k files for a route no page calls; failing loudly beats silently
 * returning nothing if one is ever wired up.
 */
function unsupported(method: string): never {
  throw new Error(
    `api.${method}() is not available in static mode — no backend is deployed. ` +
      `Either add it to export_static, or guard the call with NEXT_PUBLIC_DATA_MODE.`,
  );
}

export const staticApi: GempaApi = {
  // ---------------------------------------------------------------- 1. files
  liveEvents: () => getJson<Paginated<EarthquakeEvent>>("/earthquakes/live/index.json"),
  liveEventsGeo: () =>
    getJson<GeoFeatureCollection>("/earthquakes/live/format_geo-geojson.json"),
  feltEvents: () => getJson<Paginated<EarthquakeEvent>>("/earthquakes/felt/index.json"),
  event: () => unsupported("event"),

  regions: () => getJson<Paginated<AdminRegion>>("/regions/index.json"),
  region: (slug: string) => getJson<AdminRegion>(`/regions/${slug}/index.json`),
  riskProfile: (slug: string) =>
    getJson<RegionRiskProfile>(`/regions/${slug}/risk-profile/index.json`),
  regionTimeline: (slug: string) =>
    getJson<RegionTimeline>(`/regions/${slug}/timeline/index.json`),

  faults: () => getJson<GeoFeatureCollection>("/faults/index.json"),
  coastalZones: () =>
    getJson<{ zones: TsunamiZone[]; methodology: string }>(
      "/tsunami-risk/coastal-zones/index.json",
    ),
  disasterTimeline: () =>
    getJson<HistoricalDisaster[]>("/disasters/timeline/index.json"),
  meta: () => getJson("/meta/index.json"),

  // ----------------------------------------------------------- 2. recomposed
  disaster: async (id: number) => {
    const all = await getJson<HistoricalDisaster[]>("/disasters/timeline/index.json");
    const found = all.find((d) => d.id === id);
    if (!found) throw new Error(`disaster ${id} not found`);
    return found;
  },

  /**
   * Mirrors the DRF view: case-insensitive substring match on name, first 20.
   * An empty query returns the unfiltered head, same as the server.
   */
  searchRegions: async (q: string) => {
    const { results } = await getJson<Paginated<AdminRegion>>("/regions/index.json");
    const needle = q.trim().toLowerCase();
    const matched = needle
      ? results.filter((r) => r.name.toLowerCase().includes(needle))
      : results;
    return matched.slice(0, 20);
  },

  /**
   * The export ships both orderings at full length; any (limit, order) the UI
   * asks for is a prefix of one of them, ranks included.
   */
  leaderboard: async (limit = 10, order: "asc" | "desc" = "desc") => {
    const payload = await getJson<{ results: LeaderboardRow[]; count: number }>(
      `/regions/leaderboard/limit-50_order-${order}.json`,
    );
    const results = payload.results.slice(0, Math.min(limit, 50));
    return { results, count: results.length };
  },

  /** Same contract as the server: requested order preserved, unknown slugs dropped. */
  compareRegions: async (slugs: string[]) => {
    const settled = await Promise.all(
      slugs.map((slug) =>
        getJson<RegionRiskProfile>(`/regions/${slug}/risk-profile/index.json`).catch(
          () => null,
        ),
      ),
    );
    return settled.filter((p): p is RegionRiskProfile => p !== null);
  },

  // --------------------------------------------------------------- 3. engine
  nearestRegion: async (lat: number, lng: number) => {
    const data = await engine();
    const region = engineNearestRegion(data, lat, lng);
    if (!region) throw new Error("no regions loaded");
    return region as AdminRegion;
  },

  riskCheck: async (lat: number, lng: number) => {
    const data = await engine();
    return buildPointRiskReport(data, lat, lng) as unknown as RiskCheckReport;
  },
};

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

// Browser calls the published host port (NEXT_PUBLIC_API_URL); server-side
// rendering runs inside the container and must reach the backend service
// directly (INTERNAL_API_URL, e.g. http://backend:8000).
const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL ?? PUBLIC_BASE
    : PUBLIC_BASE;

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

async function get<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Earthquakes
  liveEvents: () =>
    get<Paginated<EarthquakeEvent>>("/earthquakes/live/", 300),
  liveEventsGeo: () =>
    get<GeoFeatureCollection>("/earthquakes/live/?format_geo=geojson", 300),
  feltEvents: () => get<Paginated<EarthquakeEvent>>("/earthquakes/felt/", 300),
  event: (id: number) => get<EarthquakeEvent>(`/earthquakes/${id}/`),

  // Regions (looked up by slug)
  regions: () => get<Paginated<AdminRegion>>("/regions/"),
  region: (slug: string) => get<AdminRegion>(`/regions/${slug}/`),
  riskProfile: (slug: string) =>
    get<RegionRiskProfile>(`/regions/${slug}/risk-profile/`, 3600),
  regionTimeline: (slug: string) =>
    get<RegionTimeline>(`/regions/${slug}/timeline/`, 3600),
  searchRegions: (q: string) =>
    get<AdminRegion[]>(`/regions/search/?q=${encodeURIComponent(q)}`),
  leaderboard: (limit = 10, order: "asc" | "desc" = "desc") =>
    get<{ results: LeaderboardRow[]; count: number }>(
      `/regions/leaderboard/?limit=${limit}&order=${order}`,
      3600,
    ),
  compareRegions: (slugs: string[]) =>
    get<RegionRiskProfile[]>(
      `/regions/compare/?slugs=${slugs.map(encodeURIComponent).join(",")}`,
      3600,
    ),
  nearestRegion: (lat: number, lng: number) =>
    get<AdminRegion>(`/regions/nearest/?lat=${lat}&lng=${lng}`),

  // Faults
  faults: () => get<GeoFeatureCollection>("/faults/", 86400),

  // Tsunami
  coastalZones: () =>
    get<{ zones: TsunamiZone[]; methodology: string }>(
      "/tsunami-risk/coastal-zones/",
      3600,
    ),

  // Disasters
  disasterTimeline: () =>
    get<HistoricalDisaster[]>("/disasters/timeline/", 86400),
  disaster: (id: number) => get<HistoricalDisaster>(`/disasters/${id}/`),

  // Risk check (live POST)
  riskCheck: async (lat: number, lng: number): Promise<RiskCheckReport> => {
    const res = await fetch(`${API_BASE}/api/risk-check/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    if (!res.ok) throw new Error(`risk-check failed: ${res.status}`);
    return res.json() as Promise<RiskCheckReport>;
  },
};

export { API_BASE };

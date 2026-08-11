export type Source = "BMKG" | "USGS";
export type RiskTier = "LOW" | "MODERATE" | "HIGH";

export interface EarthquakeEvent {
  id: number;
  external_id: string;
  source: Source;
  source_attribution: string;
  event_time: string;
  magnitude: number;
  depth_km: number;
  latitude: number;
  longitude: number;
  location_description: string;
  region: number | null;
  region_name: string | null;
  felt_reports: string | null;
  potensi_tsunami: boolean | null;
  shakemap_url: string | null;
  is_preliminary: boolean;
}

export interface AdminRegion {
  id: number;
  name: string;
  slug: string;
  type: "provinsi" | "kabupaten" | "kota";
  parent: number | null;
  is_coastal: boolean;
  latitude: number;
  longitude: number;
}

export interface RegionRiskProfile {
  region: AdminRegion;
  event_count_m4: number;
  event_count_m5: number;
  event_count_m6: number;
  event_count_m7_plus: number;
  largest_magnitude: number | null;
  largest_event: EarthquakeEvent | null;
  avg_depth_km: number | null;
  nearest_fault: number | null;
  nearest_fault_name: string | null;
  nearest_fault_distance_km: number | null;
  tsunami_risk_tier: RiskTier | null;
  composite_score: number | null;
  activity_tier: RiskTier | null;
  activity_percentile: number | null;
  /**
   * How many regions the percentile ranks against. Optional because profiles
   * exported before this field existed do not carry it — consumers fall back to
   * naming the comparison set without a count rather than implying a national
   * ranking.
   */
  activity_percentile_basis?: { region_count: number } | null;
  shallow_ratio: number | null;
  earliest_event_year: number | null;
  latest_event_year: number | null;
  last_updated: string | null;
}

export interface LeaderboardRow {
  rank: number;
  region_name: string;
  slug: string;
  type: string;
  composite_score: number;
  activity_tier: RiskTier;
  activity_percentile: number;
  event_count_m4: number;
  largest_magnitude: number | null;
  tsunami_risk_tier: RiskTier | null;
}

export interface TimelineEvent {
  id: number;
  event_time: string;
  magnitude: number;
  depth_km: number;
  source: Source;
}

export interface RegionTimeline {
  region: AdminRegion;
  events: TimelineEvent[];
  source_attribution: string[];
}

export interface HistoricalDisaster {
  id: number;
  name: string;
  slug: string;
  event_date: string;
  magnitude: number | null;
  latitude: number;
  longitude: number;
  casualties: number | null;
  displaced: number | null;
  description: string;
  image_url: string | null;
  source_links: string[];
}

/**
 * One term of the composite score, as the engine resolved it for this point.
 * `points` is rounded to 1dp independently of the others, so the four can miss
 * the reported total by up to 0.2 — composite_score is the authority.
 */
export interface ScoreComponent {
  key: "frequency" | "magnitude" | "shallow" | "proximity";
  points: number;
  max_points: number;
  basis: Record<string, number | null>;
  saturated: boolean;
}

/**
 * The score recomputed with the single largest nearby event removed. Null when
 * there is nothing to remove, or when removing it would leave no record at all.
 */
export interface LargestEventSensitivity {
  removed: { magnitude: number; year: number | null; depth_km: number | null };
  next_largest_magnitude: number | null;
  score_without: number;
  score_delta: number;
  tier_without: RiskTier | null;
}

/** The tier AND the count and thresholds that produced it. */
export interface TsunamiEvidence {
  tier: RiskTier | null;
  qualifying_events: number;
  is_coastal: boolean;
  /** "Coastal" is a precomputed proxy for an offshore epicentre, not coastline geometry. */
  coastal_is_approximate: boolean;
  criteria: {
    search_radius_km: number;
    max_depth_km: number;
    min_magnitude: number;
    high_threshold: number;
    moderate_threshold: number;
  };
}

export interface RiskCheckReport {
  query: { latitude: number; longitude: number };
  nearest_region: { id: number; name: string; slug: string; type: string } | null;
  event_count_m4_within_50km: number;
  largest_magnitude_within_50km: number | null;
  overall_risk_band: RiskTier;
  composite_score: number;
  score_breakdown: ScoreComponent[];
  activity_tier: RiskTier;
  activity_percentile: number | null;
  nearest_fault: { id: number; name: string; distance_km: number | null } | null;
  tsunami_risk_tier: RiskTier | null;
  tsunami_evidence: TsunamiEvidence;
  activity_percentile_basis: { region_count: number };
  largest_event_sensitivity: LargestEventSensitivity | null;
  comparison: { reference_city: string; relation: string; text: string };
  /** The same comparison against every reference anchor, not just Jakarta. */
  comparison_set: Array<{
    reference_city: string;
    reference_m4_count: number;
    relation: string;
  }>;
  data_coverage: { earliest_year: number | null; latest_year: number | null; years: number };
  methodology_note: string;
  source_attribution: string[];
}

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: string; coordinates: number[] | number[][] };
    properties: Record<string, unknown>;
    id?: number;
  }>;
}

export interface TsunamiZone {
  region_id: number;
  region_name: string;
  slug: string;
  latitude: number;
  longitude: number;
  tsunami_risk_tier: RiskTier;
}

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
  last_updated: string | null;
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

export interface RiskCheckReport {
  query: { latitude: number; longitude: number };
  nearest_region: { id: number; name: string; slug: string; type: string } | null;
  event_count_m4_within_50km: number;
  largest_magnitude_within_50km: number | null;
  overall_risk_band: RiskTier;
  nearest_fault: { id: number; name: string; distance_km: number | null } | null;
  tsunami_risk_tier: RiskTier | null;
  comparison: { reference_city: string; relation: string; text: string };
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

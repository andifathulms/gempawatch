"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON, Tooltip } from "react-leaflet";
import type { Feature, FeatureCollection, MultiPolygon } from "geojson";
import type { Layer, Path } from "leaflet";
import { riskTierColor, riskTierLabel } from "@/lib/seismic";
import type { RegionScorePoint } from "./HazardMap";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ATTRIBUTION =
  'Batas wilayah: <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener noreferrer">geoBoundaries</a> (BPS, WFP, OCHA) · CC BY 3.0 IGO';

type Outline = FeatureCollection<MultiPolygon, { slug: string }>;
let cache: Promise<Outline | null> | null = null;
function loadOutlines(): Promise<Outline | null> {
  if (!cache) {
    cache = fetch(`${BASE_PATH}/boundaries/regions.geojson`)
      .then((r) => (r.ok ? (r.json() as Promise<Outline>) : null))
      .catch(() => null);
  }
  return cache;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/**
 * "Skor per wilayah": every scored kabupaten/kota shaded by its activity tier,
 * darker as the score rises within the tier's colour.
 *
 * Outlines are geoBoundaries' ADM2 shapes, matched and simplified by
 * scripts/build-boundaries.mjs (the seed data has centroids only). City
 * regions are a few kilometres across and vanish at national zoom, so each
 * region also keeps a small centroid dot.
 *
 * The shading is the score of the area the profile describes — a fixed
 * 100 km radius around its centre, not a hazard map of the polygon itself;
 * the tooltip says "skor aktivitas" rather than implying otherwise.
 */
export function RegionShadingLayer({ regions }: { regions: RegionScorePoint[] }) {
  const [outlines, setOutlines] = useState<Outline | null>(null);
  const bySlug = useMemo(() => new Map(regions.map((r) => [r.slug, r])), [regions]);

  useEffect(() => {
    loadOutlines().then(setOutlines);
  }, []);

  const style = (f?: Feature) => {
    const r = f ? bySlug.get((f.properties as { slug: string }).slug) : undefined;
    const fill = r ? riskTierColor(r.tier) : "var(--rule-strong)";
    return {
      color: fill,
      weight: 1.2,
      opacity: 0.9,
      fillColor: fill,
      fillOpacity: r ? 0.18 + (r.score / 100) * 0.42 : 0.1,
    };
  };

  const onEach = (f: Feature, layer: Layer) => {
    const r = bySlug.get((f.properties as { slug: string }).slug);
    if (!r) return;
    const name = escapeHtml(r.name);
    layer.bindTooltip(`<strong>${name}</strong><br>Skor aktivitas ${Math.round(r.score)} · ${riskTierLabel(r.tier)}`, {
      sticky: true,
    });
    layer.bindPopup(
      `<p style="font-weight:700;margin:0 0 2px">${name}</p>` +
        `<p style="margin:0 0 6px">Skor aktivitas ${Math.round(r.score)}/100 · ${riskTierLabel(r.tier)}</p>` +
        `<a href="${BASE_PATH}/region/${r.slug}/" style="font-weight:600;text-decoration:underline">Lihat profil risiko →</a>`,
    );
    layer.on({
      mouseover: () => (layer as Path).setStyle({ weight: 2.5, opacity: 1 }),
      mouseout: () => (layer as Path).setStyle({ weight: 1.2, opacity: 0.9 }),
    });
  };

  return (
    <>
      {outlines && (
        <GeoJSON
          // Remount when the scores arrive so style() sees them.
          key={regions.length}
          data={outlines}
          style={style}
          onEachFeature={onEach}
          attribution={ATTRIBUTION}
        />
      )}
      {regions.map((r) => (
        <CircleMarker
          key={r.slug}
          center={[r.latitude, r.longitude]}
          radius={3.5}
          interactive={false}
          pathOptions={{ color: "var(--paper)", weight: 1, fillColor: riskTierColor(r.tier), fillOpacity: 1 }}
        >
          <Tooltip>{r.name}</Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}

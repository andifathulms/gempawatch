"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { labelRules, leafletLayer, paintRules } from "protomaps-leaflet";
import { namedFlavor, type Flavor } from "@protomaps/basemaps";
import { useColorScheme, type ColorScheme } from "@/lib/theme";

/**
 * The basemap under every Leaflet map on the site.
 *
 * It used to be CARTO's `dark_all` raster tiles. CARTO began requiring an API
 * key, and without one every tile — on the live site too — came back as an
 * "API KEY REQUIRED" watermark, so the tool that asks "where are you?" showed
 * no geography at all.
 *
 * This is a Protomaps vector extract of Indonesia (OpenStreetMap data, zoom
 * 0–9, ~18 MB) shipped with the site at /tiles/indonesia.pmtiles and read with
 * HTTP range requests, so there is no key, no quota and no third-party host.
 * Tiles past zoom 9 are drawn by over-zooming the z9 vectors, which stays
 * sharp. The risk resolution is 50–100 km, so street-level detail beyond that
 * was never needed.
 *
 * Painted in the site's own palette (Kertas / Malam, see tokens.css) rather
 * than a stock style. Canvas can't read CSS variables, so the hexes below
 * mirror the tokens — keep them in step with tokens.css.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const TILES_URL = `${BASE_PATH}/tiles/indonesia.pmtiles`;

const PALETTE: Record<ColorScheme, Partial<Flavor>> = {
  light: {
    background: "#E6ECEA", // sea: a cool step below --paper
    water: "#E6ECEA",
    earth: "#FBFBF9", // land: brighter than the page, so coasts read
    boundaries: "#B7BFB6", // --rule-strong
    ocean_label: "#7D8A92",
    city_label: "#474F57", // --ink-2
    city_label_halo: "#FBFBF9",
    state_label: "#626B73", // --ink-3
    state_label_halo: "#FBFBF9",
    country_label: "#626B73",
    subplace_label: "#626B73",
    subplace_label_halo: "#FBFBF9",
  },
  dark: {
    background: "#0A0D0F", // sea: a step below --paper
    water: "#0A0D0F",
    earth: "#181C1F", // land
    boundaries: "#3D464C", // --rule-strong
    ocean_label: "#5E676D",
    city_label: "#AAB2B7", // --ink-2
    city_label_halo: "#181C1F",
    state_label: "#8C959B", // --ink-3
    state_label_halo: "#181C1F",
    country_label: "#8C959B",
    subplace_label: "#8C959B",
    subplace_label_halo: "#181C1F",
  },
};

function flavorFor(scheme: ColorScheme): Flavor {
  // Grayscale/black are the quietest stock styles — roads and parks stay
  // neutral, so the only colour on the map is the earthquake data on top.
  const base = namedFlavor(scheme === "dark" ? "black" : "grayscale");
  return { ...base, ...PALETTE[scheme] };
}

/** Keeps Leaflet from panning off into an empty, tile-less world. */
export const INDONESIA_BOUNDS: L.LatLngBoundsExpression = [
  [-16, 88],
  [12, 148],
];

export function BaseMap() {
  const map = useMap();
  const scheme = useColorScheme();

  useEffect(() => {
    // protomaps-leaflet extends the global `L` rather than importing Leaflet.
    (window as unknown as { L: typeof L }).L = L;
    const flavor = flavorFor(scheme);
    const layer = leafletLayer({
      url: TILES_URL,
      maxDataZoom: 9,
      backgroundColor: flavor.background,
      paintRules: paintRules(flavor),
      labelRules: labelRules(flavor, "id"),
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>',
    }) as unknown as L.Layer;
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, scheme]);

  return null;
}

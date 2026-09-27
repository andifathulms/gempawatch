"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { QuakeField } from "@/lib/quakes";
import { readToken, useColorScheme } from "@/lib/theme";

interface Props {
  field: QuakeField;
  /** Draw events up to and including this year. */
  yearTo: number;
  /** Outline this year's M5+ events — the scrubber's "now". */
  highlightYear?: number;
}

/**
 * The 1970–now record as a Leaflet layer: ~40k dots on one canvas.
 *
 * Forty thousand CircleMarkers would be forty thousand SVG nodes; a single
 * canvas in its own pane (under the fault lines and live events) redraws the
 * whole field in a few milliseconds, which is what lets the year scrubber
 * replay fifty years smoothly. The canvas is repositioned to the viewport on
 * every move and hidden during the zoom animation, which it cannot follow.
 *
 * Hover (or tap, on a phone) over a dot shows what it is — magnitude, depth,
 * year. Each redraw indexes the drawn dots into a 24px screen grid, so the
 * lookup checks a handful of neighbours instead of forty thousand dots. The
 * pane itself stays pointer-transparent; events are read off the map.
 */
const CELL = 24;
const BAND_LABEL = ["dangkal", "menengah", "dalam"];

type Hit = { x: number; y: number; r: number; i: number };
export function QuakeHistoryLayer({ field, yearTo, highlightYear }: Props) {
  const map = useMap();
  const scheme = useColorScheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ yearTo, highlightYear });
  propsRef.current = { yearTo, highlightYear };
  const drawRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const pane = map.getPane("quake-history") ?? map.createPane("quake-history");
    pane.style.zIndex = "350"; // above tiles (200), below overlays (400)
    pane.style.pointerEvents = "none";
    const canvas = L.DomUtil.create("canvas", "", pane);
    canvasRef.current = canvas;
    let grid = new Map<string, Hit[]>();
    const tip = L.tooltip({ direction: "top", className: "gw-quake-tip", opacity: 1 });
    let pinned = false;

    const draw = () => {
      const size = map.getSize();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      canvas.style.visibility = "visible";
      const g = canvas.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, size.x, size.y);

      const { yearTo: to, highlightYear: hi } = propsRef.current;
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const fills = [readToken("--depth-shallow-fill"), readToken("--depth-mid-fill"), readToken("--depth-deep-fill")];
      const ink = readToken("--ink");
      const zoom = map.getZoom();
      const k = Math.pow(1.45, zoom - 5);
      const bounds = map.getBounds().pad(0.05);
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      const north = bounds.getNorth();
      const radius = (m: number) => Math.max(0.8, (0.6 + Math.pow(m - 4.4, 1.55) * 1.1) * k);
      grid = new Map();

      g.globalCompositeOperation = dark ? "source-over" : "multiply";
      for (let i = 0; i < field.count; i++) {
        if (field.year[i] > to) continue;
        const lat = field.lat[i];
        const lon = field.lon[i];
        if (lat < south || lat > north || lon < west || lon > east) continue;
        const m = field.mag[i];
        const p = map.latLngToContainerPoint([lat, lon]);
        g.globalAlpha = m >= 6 ? 0.85 : m >= 5 ? 0.6 : dark ? 0.32 : 0.38;
        g.fillStyle = fills[field.band[i]];
        const r = radius(m);
        g.beginPath();
        g.arc(p.x, p.y, r, 0, Math.PI * 2);
        g.fill();
        const key = `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)}`;
        const cell = grid.get(key);
        const hit = { x: p.x, y: p.y, r, i };
        if (cell) cell.push(hit);
        else grid.set(key, [hit]);
      }
      g.globalCompositeOperation = "source-over";
      if (hi != null) {
        g.globalAlpha = 0.9;
        g.strokeStyle = ink;
        g.lineWidth = 1.4;
        for (let i = 0; i < field.count; i++) {
          if (field.year[i] !== hi || field.mag[i] < 5) continue;
          const p = map.latLngToContainerPoint([field.lat[i], field.lon[i]]);
          g.beginPath();
          g.arc(p.x, p.y, radius(field.mag[i]) + 3, 0, Math.PI * 2);
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    };
    drawRef.current = draw;
    // The canvas pans with its pane but cannot follow the zoom animation.
    const hide = () => {
      canvas.style.visibility = "hidden";
      unpin();
    };
    const unpin = () => {
      map.closeTooltip(tip);
      pinned = false;
    };

    /** Nearest drawn dot under the pointer; larger events win ties. */
    const find = (pt: L.Point): Hit | null => {
      const cx = Math.floor(pt.x / CELL);
      const cy = Math.floor(pt.y / CELL);
      let best: Hit | null = null;
      let bestD = Infinity;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (const h of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
            const d = Math.hypot(h.x - pt.x, h.y - pt.y) - h.r;
            // Later entries are larger events (drawn on top), so <= keeps them.
            if (d <= Math.max(4, 10 - h.r) && d <= bestD) {
              best = h;
              bestD = d;
            }
          }
      return best;
    };

    const show = (h: Hit) => {
      const i = h.i;
      tip
        .setLatLng([field.lat[i], field.lon[i]])
        .setContent(
          `<strong>M${field.mag[i].toFixed(1)}</strong> · ${field.year[i]}<br>` +
            `Kedalaman ±${field.depthKm[i]} km (${BAND_LABEL[field.band[i]]})<br>` +
            `<span class="gw-quake-tip-src">Sumber: BMKG · USGS</span>`,
        );
      tip.options.offset = [0, -h.r - 2];
      map.openTooltip(tip);
    };

    // Only when the pointer is over the base layers: live events and score
    // markers sit above this pane and bring their own tooltips.
    const overBase = (e: L.LeafletMouseEvent) =>
      !(e.originalEvent.target as Element | null)?.closest?.(".leaflet-interactive, .leaflet-control");

    const onMove = (e: L.LeafletMouseEvent) => {
      if (pinned) return;
      const h = overBase(e) ? find(e.containerPoint) : null;
      map.getContainer().style.cursor = h ? "pointer" : "";
      if (h) show(h);
      else map.closeTooltip(tip);
    };
    const onClick = (e: L.LeafletMouseEvent) => {
      const h = overBase(e) ? find(e.containerPoint) : null;
      if (h) {
        show(h);
        pinned = true; // a tap keeps it open until the next tap
      } else {
        map.closeTooltip(tip);
        pinned = false;
      }
    };
    const onOut = () => {
      if (!pinned) map.closeTooltip(tip);
    };

    map.on("moveend zoomend resize viewreset", draw);
    map.on("zoomstart", hide);
    map.on("dragstart", unpin);
    map.on("mousemove", onMove);
    map.on("click", onClick);
    map.on("mouseout", onOut);
    draw();
    return () => {
      map.off("moveend zoomend resize viewreset", draw);
      map.off("zoomstart", hide);
      map.off("dragstart", unpin);
      map.off("mousemove", onMove);
      map.off("click", onClick);
      map.off("mouseout", onOut);
      map.closeTooltip(tip);
      map.getContainer().style.cursor = "";
      canvas.remove();
    };
  }, [map, field]);

  useEffect(() => {
    drawRef.current();
  }, [yearTo, highlightYear, scheme]);

  return null;
}

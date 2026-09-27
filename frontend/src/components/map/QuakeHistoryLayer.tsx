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
 */
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
        g.beginPath();
        g.arc(p.x, p.y, radius(m), 0, Math.PI * 2);
        g.fill();
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
    const hide = () => (canvas.style.visibility = "hidden");

    map.on("moveend zoomend resize viewreset", draw);
    map.on("zoomstart", hide);
    draw();
    return () => {
      map.off("moveend zoomend resize viewreset", draw);
      map.off("zoomstart", hide);
      canvas.remove();
    };
  }, [map, field]);

  useEffect(() => {
    drawRef.current();
  }, [yearTo, highlightYear, scheme]);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { drawQuakes, loadQuakes, type DrawOptions, type QuakeField } from "@/lib/quakes";
import { useColorScheme } from "@/lib/theme";

interface Props extends Omit<DrawOptions, "fit"> {
  /** Accessible description of what the picture shows. */
  label: string;
  className?: string;
  /**
   * Where inside the canvas the bbox is fitted, given its CSS size. Lets the
   * homepage keep the archipelago clear of the floating ask panel.
   */
  fit?: (w: number, h: number) => [number, number, number, number];
  /** Called once the field has loaded, with the event count. */
  onLoad?: (count: number) => void;
}

/**
 * The earthquake record drawn as a picture: every M4.5+ event since 1970, one
 * dot each, coloured by depth and sized by magnitude. Needs no basemap — the
 * Sunda and Banda arcs draw themselves.
 *
 * Repaints on resize and when the OS switches between Kertas and Malam
 * (canvas pixels do not follow CSS variables on their own).
 */
export function QuakeFieldCanvas({ label, className, fit, onLoad, ...draw }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [field, setField] = useState<QuakeField | null>(null);
  const scheme = useColorScheme();
  const drawKey = JSON.stringify(draw);

  useEffect(() => {
    let alive = true;
    loadQuakes().then((q) => {
      if (!alive) return;
      setField(q);
      if (q) onLoad?.(q.count);
    });
    return () => {
      alive = false;
    };
    // onLoad is a notification, not an input to the drawing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const paint = () =>
      drawQuakes(canvas, field, {
        ...draw,
        fit: fit ? fit(canvas.clientWidth, canvas.clientHeight) : undefined,
      });
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
    return () => ro.disconnect();
    // `draw` is compared through drawKey; `fit` is a layout rule, not data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, scheme, drawKey]);

  return <canvas ref={ref} role="img" aria-label={label} className={className} />;
}

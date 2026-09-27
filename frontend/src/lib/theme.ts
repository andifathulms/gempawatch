"use client";

import { useEffect, useState } from "react";

/**
 * Which of the two themes is showing: Kertas (light) or Malam (dark).
 *
 * The site follows the operating system's setting and has no toggle, so this
 * is just `prefers-color-scheme`, kept live. CSS handles almost everything on
 * its own through the tokens; this exists for the few renderers CSS cannot
 * reach — the vector basemap and the quake-field canvas draw pixels, so they
 * must be told to repaint when the phone switches to dark mode at sunset.
 *
 * Returns "light" during server rendering and the first client render, which
 * matches the tokens' default and keeps hydration stable.
 */
export type ColorScheme = "light" | "dark";

export function useColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>("light");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setScheme(mq.matches ? "dark" : "light");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return scheme;
}

/**
 * Resolve a CSS custom property to its current computed value, for canvas
 * code that cannot take `var(--x)` directly. SVG attributes can — prefer those.
 */
export function readToken(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Does this visitor want motion kept to a minimum?
 *
 * The reduced-motion rule in globals.css neutralises every CSS animation and
 * transition on the site, but it cannot reach motion a library drives itself.
 * Leaflet animates its zoom and pan in JavaScript, so a map recentring on a
 * shortcut city flew across the screen regardless of the preference. Its
 * animation flags are constructor options, which means they need the answer as
 * a boolean rather than as a stylesheet.
 *
 * Returns false during server rendering, where there is no preference to read
 * and no motion to suppress; the map is a client-only component anyway.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

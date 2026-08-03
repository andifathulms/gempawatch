import { IS_STATIC } from "./api";

/**
 * URL for a shareable risk result.
 *
 * Live deploys use a path segment (`/risk/-6.2000/106.8000`) so the page can be
 * server-rendered and unfurl a per-location OG card. A static host cannot serve
 * an unbounded set of paths, so those builds carry the coordinates in the query
 * string and render client-side instead — same page, same content, no OG image.
 */
export function riskResultPath(lat: number, lng: number): string {
  const la = lat.toFixed(4);
  const ln = lng.toFixed(4);
  return IS_STATIC ? `/risk/?lat=${la}&lng=${ln}` : `/risk/${la}/${ln}`;
}

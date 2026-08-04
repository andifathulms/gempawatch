/**
 * Web app manifest — what Android's "Add to home screen" and desktop install
 * read.
 *
 * Served from a route handler rather than the `app/manifest.ts` file
 * convention, which sounds like the obvious choice and is not: that convention
 * emits its <link rel="manifest"> without the basePath prefix *and* overrides
 * an explicit `metadata.manifest`, so on a project site the browser requests
 * /manifest.webmanifest, gets a 404, and there is no install prompt or
 * home-screen icon at all. A plain route is not special-cased, so the link in
 * layout.tsx keeps its prefix and both deployment modes work from one source.
 *
 * Deliberately no service worker. Installability without one still gets the
 * home-screen icon, the standalone window, and themed chrome — and a service
 * worker's job is offline caching, which is the wrong default here. Serving a
 * cached seismic feed to someone who opened the app during an outage would
 * show stale earthquake data with no sign that it is stale, which for a risk
 * product is worse than showing nothing.
 */
export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function GET() {
  return Response.json({
    name: "GempaWatch — Intelijen Risiko Gempa Indonesia",
    short_name: "GempaWatch",
    description:
      "Pahami risiko gempa di lokasimu berdasarkan data BMKG dan catatan seismik historis USGS. Indikator pola historis — bukan sistem peringatan dini.",
    id: `${BASE}/`,
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#121110",
    theme_color: "#121110",
    lang: "id",
    dir: "ltr",
    categories: ["utilities", "education", "news", "weather"],
    icons: [
      {
        src: `${BASE}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Separate artwork, not the same file relabelled: launchers crop maskable
      // icons to their own shape, and the mark's seismograph trace runs the
      // full width of its tile — declaring the standard icon maskable would
      // slice the ends off the line on any circular mask.
      {
        src: `${BASE}/icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Cek risiko lokasi saya",
        short_name: "Cek Risiko",
        url: `${BASE}/risk-check/`,
      },
      { name: "Peta bahaya & sesar", short_name: "Peta", url: `${BASE}/map/` },
    ],
  });
}

/**
 * The site's own name and blurb, in one place.
 *
 * These were locals in layout.tsx, which meant the homepage could not reuse
 * them without retyping them — and a retyped description is a description that
 * drifts. Anything needing the site-level strings imports them from here.
 */
export const SITE_TITLE = "GempaWatch — Intelijen Risiko Gempa Indonesia";
export const SITE_DESCRIPTION =
  "Pahami risiko gempa di lokasi Anda berdasarkan data BMKG dan catatan seismik historis USGS. Bukan sistem peringatan dini — indikator pola historis.";

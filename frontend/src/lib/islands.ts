/**
 * Which island group a region belongs to, from its centroid.
 *
 * Used to group the /regions index ("Wilayah") and label region pages. The
 * admin-region data carries no province or island field, and island groups
 * are stable geography, so they are derived here from coordinates rather
 * than added as a backend field and migration. The boxes are coarse on
 * purpose and ordered so the first match wins; the Wallace-line edges that
 * matter (Bali vs Jawa, Mamuju vs Kalimantan, Sorong vs Maluku) are checked
 * against every scored region in lib/__tests__/islands.test.ts.
 */
export const ISLANDS = [
  "Sumatra",
  "Jawa",
  "Bali & Nusa Tenggara",
  "Kalimantan",
  "Sulawesi",
  "Maluku",
  "Papua",
] as const;

export type Island = (typeof ISLANDS)[number];

export function islandOf(lat: number, lng: number): Island {
  // Jawa incl. Banten, Jakarta and Madura; Banyuwangi (114.37°E) stays in.
  if (lng >= 105.9 && lng < 114.45 && lat <= -5.8 && lat >= -9) return "Jawa";
  // Bali to Timor: everything south of ~7.9°S east of the Bali Strait.
  if (lng >= 114.45 && lng < 127.5 && lat < -7.9) return "Bali & Nusa Tenggara";
  // Sumatra with Simeulue, Nias, Mentawai, Riau islands and Bangka-Belitung.
  if (lng < 105.9 || (lng < 108.5 && lat > -3.6)) return "Sumatra";
  if (lng < 118.5 && lat > -4.5) return "Kalimantan";
  if (lng >= 118.5 && lng < 125.3 && lat > -6.8 && lat < 2.4) return "Sulawesi";
  if (lng >= 130.8) return "Papua";
  return "Maluku";
}

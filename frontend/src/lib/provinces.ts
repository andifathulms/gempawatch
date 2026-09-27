/**
 * Province of each scored region, keyed by region name.
 *
 * The seed data (backend/data/admin_regions.geojson) carries the province as
 * `parent`, but the API exports AdminRegion.parent as a foreign key that is
 * never populated, so the name reaches the frontend as null. Rather than a
 * backend migration for a label, the mapping lives here; lib/__tests__/
 * provinces.test.ts fails if it drifts from the GeoJSON.
 */
export const PROVINCE_BY_REGION: Record<string, string> = {
  "Aceh Besar": "Aceh",
  "Banda Aceh": "Aceh",
  "Bandar Lampung": "Lampung",
  "Bantul": "DI Yogyakarta",
  "Banyuwangi": "Jawa Timur",
  "Bengkulu": "Bengkulu",
  "Biak Numfor": "Papua",
  "Buleleng": "Bali",
  "Cianjur": "Jawa Barat",
  "Cilacap": "Jawa Tengah",
  "Denpasar": "Bali",
  "Donggala": "Sulawesi Tengah",
  "Garut": "Jawa Barat",
  "Jakarta Pusat": "DKI Jakarta",
  "Jayapura": "Papua",
  "Kepulauan Mentawai": "Sumatera Barat",
  "Kota Ambon": "Maluku",
  "Kota Balikpapan": "Kalimantan Timur",
  "Kota Bandung": "Jawa Barat",
  "Kota Batam": "Kepulauan Riau",
  "Kota Bekasi": "Jawa Barat",
  "Kota Bogor": "Jawa Barat",
  "Kota Gorontalo": "Gorontalo",
  "Kota Gunungsitoli": "Sumatera Utara",
  "Kota Jambi": "Jambi",
  "Kota Kendari": "Sulawesi Tenggara",
  "Kota Kupang": "Nusa Tenggara Timur",
  "Kota Lhokseumawe": "Aceh",
  "Kota Makassar": "Sulawesi Selatan",
  "Kota Malang": "Jawa Timur",
  "Kota Manado": "Sulawesi Utara",
  "Kota Mataram": "Nusa Tenggara Barat",
  "Kota Medan": "Sumatera Utara",
  "Kota Palembang": "Sumatera Selatan",
  "Kota Palu": "Sulawesi Tengah",
  "Kota Pariaman": "Sumatera Barat",
  "Kota Pekanbaru": "Riau",
  "Kota Pontianak": "Kalimantan Barat",
  "Kota Semarang": "Jawa Tengah",
  "Kota Surabaya": "Jawa Timur",
  "Kota Surakarta": "Jawa Tengah",
  "Kota Ternate": "Maluku Utara",
  "Kota Yogyakarta": "DI Yogyakarta",
  "Lombok Timur": "Nusa Tenggara Barat",
  "Majene": "Sulawesi Barat",
  "Pacitan": "Jawa Timur",
  "Padang": "Sumatera Barat",
  "Pangandaran": "Jawa Barat",
  "Sikka": "Nusa Tenggara Timur",
  "Simeulue": "Aceh",
  "Sorong": "Papua Barat Daya",
  "Sukabumi": "Jawa Barat",
};

export function provinceOf(regionName: string): string | null {
  return PROVINCE_BY_REGION[regionName] ?? null;
}

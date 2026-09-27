import { describe, expect, it } from "vitest";
import { islandOf } from "../islands";

// Centroids from the region export, chosen at the boundaries the coarse boxes
// have to get right.
describe("islandOf", () => {
  it.each([
    ["Banda Aceh", 5.55, 95.32, "Sumatra"],
    ["Simeulue", 2.48, 96.38, "Sumatra"],
    ["Kepulauan Mentawai", -1.95, 99.62, "Sumatra"],
    ["Bandar Lampung", -5.43, 105.27, "Sumatra"],
    ["Kota Batam", 1.0456, 104.0305, "Sumatra"],
    ["Jakarta Pusat", -6.18, 106.83, "Jawa"],
    ["Banyuwangi", -8.2192, 114.3691, "Jawa"],
    ["Denpasar", -8.67, 115.22, "Bali & Nusa Tenggara"],
    ["Kota Kupang", -10.17, 123.61, "Bali & Nusa Tenggara"],
    ["Kota Pontianak", -0.0263, 109.3425, "Kalimantan"],
    ["Kota Balikpapan", -1.2379, 116.8529, "Kalimantan"],
    ["Majene", -3.5403, 118.9707, "Sulawesi"],
    ["Kota Makassar", -5.15, 119.42, "Sulawesi"],
    ["Kota Manado", 1.49, 124.85, "Sulawesi"],
    ["Kota Ternate", 0.79, 127.38, "Maluku"],
    ["Kota Ambon", -3.7, 128.18, "Maluku"],
    ["Sorong", -0.88, 131.25, "Papua"],
    ["Jayapura", -2.53, 140.72, "Papua"],
  ])("%s → %s", (_name, lat, lng, island) => {
    expect(islandOf(lat, lng)).toBe(island);
  });
});

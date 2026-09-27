import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PROVINCE_BY_REGION } from "../provinces";

// The mapping is a copy of the seed data's `parent` field (see provinces.ts);
// this keeps the two from drifting when regions are added.
describe("PROVINCE_BY_REGION", () => {
  it("matches backend/data/admin_regions.geojson", () => {
    const file = path.resolve(__dirname, "../../../../backend/data/admin_regions.geojson");
    const geo = JSON.parse(readFileSync(file, "utf8")) as {
      features: Array<{ properties: { name: string; parent: string } }>;
    };
    const expected = Object.fromEntries(geo.features.map((f) => [f.properties.name, f.properties.parent]));
    expect(PROVINCE_BY_REGION).toEqual(expected);
  });
});

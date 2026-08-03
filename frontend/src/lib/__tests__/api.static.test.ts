/**
 * Smoke-tests the static client against the real export tree over HTTP.
 *
 * The point is path mapping: every method has to land on a file that
 * export_static actually wrote. A typo here produces a 404 at runtime on a
 * deployed site, where nothing else would catch it.
 */
import { createServer, type Server } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PUBLIC_DIR = path.resolve(__dirname, "../../../public");

let server: Server;
let staticApi: typeof import("../api.static").staticApi;

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const filePath = path.join(PUBLIC_DIR, decodeURIComponent(req.url ?? ""));
    try {
      const info = await stat(filePath);
      if (!info.isFile()) throw new Error("not a file");
      res.writeHead(200, { "Content-Type": "application/json" });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const { port } = server.address() as AddressInfo;
  // Read at module load, so it must be set before the import.
  process.env.NEXT_PUBLIC_BASE_PATH = `http://127.0.0.1:${port}`;
  ({ staticApi } = await import("../api.static"));
}, 30_000);

afterAll(() => {
  server?.close();
});

describe("static api reads the export tree", () => {
  it("liveEvents", async () => {
    const r = await staticApi.liveEvents();
    expect(r).toHaveProperty("results");
  });

  it("feltEvents", async () => {
    expect((await staticApi.feltEvents()).count).toBeGreaterThanOrEqual(0);
  });

  it("liveEventsGeo returns a FeatureCollection", async () => {
    expect((await staticApi.liveEventsGeo()).type).toBe("FeatureCollection");
  });

  it("regions", async () => {
    expect((await staticApi.regions()).results.length).toBeGreaterThan(0);
  });

  it("faults", async () => {
    expect((await staticApi.faults()).features.length).toBeGreaterThan(0);
  });

  it("coastalZones", async () => {
    const r = await staticApi.coastalZones();
    expect(Array.isArray(r.zones)).toBe(true);
    expect(r.methodology).toBeTruthy();
  });

  it("disasterTimeline", async () => {
    expect((await staticApi.disasterTimeline()).length).toBeGreaterThan(0);
  });

  it("meta", async () => {
    expect((await staticApi.meta()).event_count).toBeGreaterThan(0);
  });

  it("per-region endpoints resolve for every exported region", async () => {
    const { results } = await staticApi.regions();
    for (const region of results) {
      const profile = await staticApi.riskProfile(region.slug);
      expect(profile.region.slug).toBe(region.slug);
      const timeline = await staticApi.regionTimeline(region.slug);
      expect(timeline.region.slug).toBe(region.slug);
      const detail = await staticApi.region(region.slug);
      expect(detail.slug).toBe(region.slug);
    }
  });
});

describe("locally recomposed endpoints", () => {
  it("searchRegions filters case-insensitively and caps at 20", async () => {
    const { results } = await staticApi.regions();
    const sample = results[0].name.slice(0, 3).toUpperCase();
    const hits = await staticApi.searchRegions(sample);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(20);
    expect(
      hits.every((r) => r.name.toLowerCase().includes(sample.toLowerCase())),
    ).toBe(true);
  });

  it("searchRegions returns nothing for a non-matching query", async () => {
    expect(await staticApi.searchRegions("zzzzzzzz")).toHaveLength(0);
  });

  it("leaderboard honours limit and both orderings", async () => {
    const desc = await staticApi.leaderboard(5, "desc");
    expect(desc.results).toHaveLength(5);
    expect(desc.results[0].rank).toBe(1);
    const scores = desc.results.map((r) => r.composite_score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);

    const asc = await staticApi.leaderboard(5, "asc");
    const ascScores = asc.results.map((r) => r.composite_score);
    expect([...ascScores].sort((a, b) => a - b)).toEqual(ascScores);
  });

  it("compareRegions preserves order and drops unknown slugs", async () => {
    const { results } = await staticApi.regions();
    const [a, b] = results;
    const compared = await staticApi.compareRegions([b.slug, "no-such-region", a.slug]);
    expect(compared.map((p) => p.region.slug)).toEqual([b.slug, a.slug]);
  });
});

describe("engine-backed endpoints", () => {
  it("nearestRegion resolves a coordinate to a region", async () => {
    const region = await staticApi.nearestRegion(-6.2, 106.8);
    expect(region.slug).toBeTruthy();
  }, 60_000);

  it("riskCheck returns a complete report", async () => {
    const report = await staticApi.riskCheck(-6.2, 106.8);
    expect(report.composite_score).toBeGreaterThan(0);
    expect(report.methodology_note).toContain("bukan prediksi");
    expect(report.source_attribution.length).toBeGreaterThan(0);
  }, 60_000);
});

describe("unsupported endpoints fail loudly", () => {
  it("event() explains why rather than returning undefined", () => {
    expect(() => staticApi.event(1)).toThrow(/not available in static mode/);
  });
});

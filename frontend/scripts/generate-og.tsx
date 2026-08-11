/**
 * Render one Open Graph card per region, ahead of the static build.
 *
 * Next's `opengraph-image` file convention cannot do this on a static export:
 * with `output: "export"`, metadata image routes in a dynamic segment reject
 * `generateStaticParams` outright — verified against Next 14.2.5, where even a
 * hardcoded two-item list fails with "is missing generateStaticParams()". So
 * the route stays live-only and the static publish renders the same cards here
 * instead.
 *
 * It calls renderOgCard, the same function the live route calls, so the two
 * deployment modes cannot drift into different-looking cards — which is the
 * whole reason the card lives in lib/og.tsx rather than inside a route.
 *
 * Reads the exported API tree straight off disk; no loopback server needed.
 * Run after `export_static` has been copied into public/, before `next build`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ogPercentileText, renderOgCard } from "../src/lib/og";
import type { AdminRegion, RegionRiskProfile } from "../src/lib/types";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const API = path.join(ROOT, "public", "api");
const OUT = path.join(ROOT, "public", "og");

async function readJson<T>(...segments: string[]): Promise<T> {
  return JSON.parse(await readFile(path.join(API, ...segments), "utf-8")) as T;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const { results } = await readJson<{ results: AdminRegion[] }>(
    "regions",
    "index.json",
  );

  let written = 0;
  let bytes = 0;
  for (const region of results) {
    const profile = await readJson<RegionRiskProfile>(
      "regions",
      region.slug,
      "risk-profile",
      "index.json",
    );
    const pct = profile.activity_percentile;

    const response = renderOgCard({
      kicker: profile.region.type,
      title: profile.region.name,
      scoreLabel:
        profile.composite_score != null
          ? profile.composite_score.toFixed(0)
          : "—",
      tier: profile.activity_tier,
      percentileText: ogPercentileText(pct, profile.activity_percentile_basis?.region_count),
      stats: [
        { label: "Gempa M4+", value: String(profile.event_count_m4) },
        {
          label: "Terbesar",
          value: profile.largest_magnitude
            ? `M${profile.largest_magnitude.toFixed(1)}`
            : "—",
        },
        { label: "Sesar terdekat", value: profile.nearest_fault_name ?? "—" },
      ],
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(path.join(OUT, `region-${region.slug}.png`), buffer);
    written++;
    bytes += buffer.length;
  }

  console.log(
    `▸ ${written} OG cards written to public/og (${Math.round(bytes / 1024)} kB total, ` +
      `${Math.round(bytes / written / 1024)} kB average)`,
  );
}

main().catch((err) => {
  console.error("OG generation failed:", err);
  process.exit(1);
});

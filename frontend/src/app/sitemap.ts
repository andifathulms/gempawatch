import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

/**
 * The 24 region pages are fully prerendered and linked from /explore, so a
 * crawler could reach them — but nothing advertised them, and sitemap.xml was a
 * 404. They are the site's long tail: one page per kabupaten/kota, each
 * answering a query someone actually types.
 *
 * Region URLs are enumerated from the same API call that generateStaticParams
 * uses, so the sitemap cannot list a page the build did not produce, or miss
 * one it did.
 */
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STATIC_PATHS = [
  { path: "/", priority: 1 },
  { path: "/explore", priority: 0.9 },
  { path: "/risk-check", priority: 0.9 },
  { path: "/map", priority: 0.7 },
  { path: "/timeline", priority: 0.7 },
  { path: "/about", priority: 0.6 },
  { path: "/compare", priority: 0.5 },
];

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${ORIGIN}${BASE_PATH}${path}`;

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: url(p.path),
    priority: p.priority,
    changeFrequency: "daily" as const,
  }));

  try {
    const { results } = await api.regions();
    for (const region of results) {
      entries.push({
        url: url(`/region/${region.slug}`),
        priority: 0.8,
        changeFrequency: "daily" as const,
      });
    }
  } catch {
    // A region-listing outage should cost the sitemap its long tail, not the
    // whole file.
  }

  return entries;
}

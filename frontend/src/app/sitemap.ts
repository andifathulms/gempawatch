import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import type { RegionRiskProfile } from "@/lib/types";

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

  /*
    lastModified comes from the profiles' own last_updated, not from a build
    clock. Every publish rewrites every file, so a build timestamp would tell a
    crawler that all 59 URLs changed on every run — which is both untrue and the
    fastest way to have lastmod ignored. The profile timestamp moves when the
    data behind the page actually moves.
  */
  let profiles: RegionRiskProfile[] = [];
  try {
    const { results } = await api.regions();
    profiles = (
      await Promise.all(
        results.map((r) => api.riskProfile(r.slug).catch(() => null)),
      )
    ).filter((p): p is RegionRiskProfile => p !== null);
  } catch {
    // A region-listing outage should cost the sitemap its long tail, not the
    // whole file.
  }

  const stamps = profiles
    .map((p) => p.last_updated)
    .filter((d): d is string => Boolean(d))
    .sort();
  // The freshest region stands in for the site as a whole: the static pages are
  // rebuilt from exactly the same export.
  const siteModified = stamps.length ? new Date(stamps[stamps.length - 1]) : undefined;

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: url(p.path),
    priority: p.priority,
    changeFrequency: "daily" as const,
    ...(siteModified ? { lastModified: siteModified } : {}),
  }));

  for (const profile of profiles) {
    entries.push({
      url: url(`/region/${profile.region.slug}`),
      priority: 0.8,
      changeFrequency: "daily" as const,
      ...(profile.last_updated
        ? { lastModified: new Date(profile.last_updated) }
        : {}),
    });
  }

  return entries;
}

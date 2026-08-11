import type { MetadataRoute } from "next";

/**
 * There was no robots.txt at all — the deployed path returned 404 — so nothing
 * pointed a crawler at the sitemap. Everything here is public read-only data,
 * so the rule is simply "allow", and the value of the file is the sitemap
 * reference rather than any exclusion.
 */
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${ORIGIN}${BASE_PATH}/sitemap.xml`,
  };
}

import type { Metadata } from "next";

/**
 * Build a route's metadata from one title and one description.
 *
 * Every page used to set only `title` and `description`, so all of them fell
 * through to the layout's static openGraph block: 33 pages, one unfurl, all
 * reading "GempaWatch — Intelijen Risiko Gempa Indonesia". Region pages were
 * worse than generic — their og:description said one thing while their
 * <meta name="description"> said another, on the same page.
 *
 * The obvious fix is to paste an openGraph block into every route, and that is
 * exactly how the two drift apart again. So the strings are written once and
 * fanned out here.
 *
 * `path` must be site-root-relative ("/about"). It is prefixed with
 * NEXT_PUBLIC_BASE_PATH because canonical and og:url are plain URL fields:
 * unlike file-based metadata such as icons and OG images, Next does not add the
 * base path to them, and on a project Pages deploy the site does not live at
 * the origin root. Getting this wrong points every canonical at a 404.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  /** Site-root-relative, with a leading slash. "/" for the homepage. */
  path: string;
}): Metadata {
  const url = `${BASE_PATH}${path === "/" ? "/" : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

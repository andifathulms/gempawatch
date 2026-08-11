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

/**
 * The share image, stated explicitly.
 *
 * app/opengraph-image.png is a file convention, and Next only merges it into a
 * route's metadata when that route does not declare `openGraph` itself. Setting
 * openGraph here to fix the titles therefore silently dropped og:image from
 * every route except the homepage — which shares the app segment the file sits
 * in. The result was worse than the bug being fixed: unfurls with a title and
 * no picture at all.
 *
 * Referenced by path rather than by importing the file convention, because the
 * convention is what stops applying the moment openGraph is declared.
 */
const SHARE_IMAGE = {
  url: `${BASE_PATH}/opengraph-image.png`,
  width: 1200,
  height: 630,
};

export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  /** Site-root-relative, with a leading slash. "/" for the homepage. */
  path: string;
  /**
   * Site-root-relative path to a card of this page's own, for routes that
   * generate one. Falls back to the shared card.
   */
  image?: string;
}): Metadata {
  const url = `${BASE_PATH}${path === "/" ? "/" : path}`;
  const card = image
    ? { url: `${BASE_PATH}${image}`, width: 1200, height: 630 }
    : SHARE_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [card] },
    twitter: { title, description, images: [card] },
  };
}

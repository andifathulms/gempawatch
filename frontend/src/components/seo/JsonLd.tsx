import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import type { RegionRiskProfile } from "@/lib/types";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const url = (path: string) => `${ORIGIN}${BASE_PATH}${path}`;

/**
 * Structured data, rendered from the same objects the page renders.
 *
 * There was none at all, so a crawler had to infer from prose what a region
 * page is. The rule that governs everything here is the one that governs the
 * meta descriptions: every value comes from the profile the page is already
 * displaying, so the markup cannot claim a score the page does not show.
 *
 * Two deliberate omissions. There is no `license`, because the site does not
 * publish one and inventing a licence in machine-readable form is worse than
 * omitting the field. And there is no SearchAction on the site markup: that
 * declares a URL template a crawler can query, and this site's search is
 * client-side with no such URL — advertising one would be a lie a crawler
 * would then follow.
 */
function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Values come from our own API, and JSON.stringify escapes the quotes and
      // backslashes that matter here; the one sequence that can still break out
      // of a script element is "</script>" inside a string.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Site-level identity, rendered once in the root layout. */
export function SiteJsonLd() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GempaWatch",
        alternateName: SITE_TITLE,
        description: SITE_DESCRIPTION,
        url: url("/"),
        inLanguage: "id-ID",
      }}
    />
  );
}

/**
 * A region page as a Dataset.
 *
 * Dataset rather than Place or Article because what the page publishes is
 * derived measurement — counts by magnitude tier, a largest recorded event, a
 * composite score — over a stated area and period, from named sources. That is
 * what the page is, and `isBasedOn` lets it credit BMKG and USGS in the markup
 * the same way the visible attribution does.
 *
 * `creator` is GempaWatch on purpose: the inputs are BMKG's and USGS's, the
 * weighting is ours, and the markup should not blur that any more than the
 * on-page provenance note does.
 */
export function RegionJsonLd({ profile }: { profile: RegionRiskProfile }) {
  const r = profile.region;
  const path = `/region/${r.slug}`;

  const variables: Array<Record<string, unknown>> = [
    {
      "@type": "PropertyValue",
      name: "Jumlah gempa M4+ dalam radius 100 km",
      value: profile.event_count_m4,
    },
  ];
  if (profile.largest_magnitude != null) {
    variables.push({
      "@type": "PropertyValue",
      name: "Magnitudo terbesar tercatat",
      value: profile.largest_magnitude,
    });
  }
  if (profile.composite_score != null) {
    variables.push({
      "@type": "PropertyValue",
      name: "Skor aktivitas seismik GempaWatch (0–100)",
      description:
        "Komposit buatan GempaWatch dari frekuensi, magnitudo terbesar, " +
        "proporsi gempa dangkal, dan jarak sesar. Bukan ukuran baku seismologi.",
      value: profile.composite_score,
      maxValue: 100,
      minValue: 0,
    });
  }

  return (
    <>
      <Script
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Profil risiko gempa historis ${r.name}`,
          description: `Ringkasan ${profile.event_count_m4} gempa M4+ dalam radius 100 km dari ${r.name}, dari catatan BMKG dan USGS.`,
          url: url(path),
          inLanguage: "id-ID",
          creator: { "@type": "Organization", name: "GempaWatch", url: url("/") },
          isBasedOn: [
            {
              "@type": "Dataset",
              name: "Katalog gempa BMKG",
              url: "https://www.bmkg.go.id/",
            },
            {
              "@type": "Dataset",
              name: "USGS Earthquake Catalog",
              url: "https://earthquake.usgs.gov/",
            },
          ],
          spatialCoverage: {
            "@type": "Place",
            name: r.name,
            geo: {
              "@type": "GeoCoordinates",
              latitude: r.latitude,
              longitude: r.longitude,
            },
          },
          ...(profile.earliest_event_year && profile.latest_event_year
            ? {
                temporalCoverage: `${profile.earliest_event_year}/${profile.latest_event_year}`,
              }
            : {}),
          ...(profile.last_updated ? { dateModified: profile.last_updated } : {}),
          variableMeasured: variables,
        }}
      />
      {/*
        Two levels, not three: /explore — the old middle "Jelajahi wilayah"
        step — retired once its job (ranking context) moved onto region pages
        themselves (DESIGN.md §10 step 5). Region pages are reached from the
        homepage directly now, not through a browse hub.
      */}
      <Script
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Beranda", item: url("/") },
            { "@type": "ListItem", position: 2, name: r.name, item: url(path) },
          ],
        }}
      />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api, IS_STATIC } from "@/lib/api";
import type { AdminRegion, RegionRiskProfile, RegionTimeline } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Disclosure, DisclosureGroup } from "@/components/ui/Disclosure";
import { RiskTierBadge } from "@/components/ui/RiskTierBadge";
import { SectionNav } from "@/components/ui/SectionNav";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { QuakeFieldCanvas } from "@/components/map/QuakeFieldCanvas";
import { FactRow, VerdictBand } from "@/components/risk/VerdictBand";
import { MagnitudeFreqChart } from "@/components/risk/MagnitudeFreqChart";
import { DepthHistogram } from "@/components/risk/DepthHistogram";
import { RegionRankRow } from "@/components/discover/RegionRankRow";
import { SeismogramComparePicker } from "@/components/risk/SeismogramComparePicker";
import { ShareButton } from "@/components/ui/ShareButton";
import { PreparednessChecklist } from "@/components/prepare/PreparednessChecklist";
import { RegionJsonLd } from "@/components/seo/JsonLd";
import { CoverageNote } from "@/components/risk/CoverageNote";
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { scoreBreakdown, scoreInputsFromProfile } from "@/lib/engine/scoring";
import { haversineKm } from "@/lib/engine/geo";
import { islandOf } from "@/lib/islands";
import { pageMetadata } from "@/lib/meta";
import { activityTierMeaning, binByDepth, riskTierLabel } from "@/lib/seismic";
import { depth, magnitude, num, regionType } from "@/lib/format";
import type { SeismogramEvent } from "@/lib/seismogram";

/**
 * The same three anchors `lib/engine/report.ts` already treats as the app's
 * canonical comparison set (see REFERENCE_CITIES there) — one vocabulary of
 * "reference city" across the whole app, not a second list invented here.
 * Slugs resolved once against the exported region data, not hardcoded
 * coordinates: `api.region()` stays the source of truth for where each one
 * actually is.
 */
const REFERENCE_CITY_SLUGS: Record<string, string> = {
  Jakarta: "jakarta-pusat",
  Padang: "padang",
  Palu: "kota-palu",
};

export const revalidate = 3600;

/**
 * Static builds prerender every region up front, since a static host has no way
 * to render one on demand. Live builds return nothing here and keep rendering
 * on request, so a newly loaded region shows up without a rebuild.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (!IS_STATIC) return [];
  const { results } = await api.regions();
  return results.map((region) => ({ slug: region.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const p = await api.riskProfile(params.slug);
    /*
      One string, used for the tab, the search result and the unfurl.

      Previously only `title` and `description` were set here, so every region
      fell through to the layout's static openGraph block — all 24 unfurled as
      "GempaWatch — Intelijen Risiko Gempa Indonesia" with the generic blurb.
      Worse, that generic og:description sat next to a page-specific
      <meta name="description">, so the two contradicted each other on the same
      page. Deriving both from `p` is what stops them drifting again.
    */
    const title = `Risiko gempa ${p.region.name}: ${riskTierLabel(p.activity_tier)}`;
    const description = `Skor ${p.composite_score?.toFixed(0) ?? "—"}/100 · ${p.event_count_m4} gempa M4+ dalam 100km · terbesar ${
      p.largest_magnitude ? `M${p.largest_magnitude.toFixed(1)}` : "—"
    }. Profil risiko historis berbasis data BMKG & USGS.`;
    // Through pageMetadata, not by hand: it is what applies the base path, and
    // building the URL locally here is precisely how this route ended up with a
    // canonical pointing at the origin root instead of the deployed subpath.
    const base = pageMetadata({
      title,
      description,
      path: `/region/${p.region.slug}`,
      // Rendered by scripts/generate-og.tsx during the static publish. Next's
      // opengraph-image convention cannot do this on an export — it rejects
      // generateStaticParams in metadata image routes — so the card is built
      // alongside and pointed at here.
      image: `/og/region-${p.region.slug}.png`,
    });
    return { ...base, openGraph: { ...base.openGraph, type: "article" } };
  } catch {
    return { title: "Profil Risiko Wilayah" };
  }
}

export default async function RegionPage({
  params,
}: {
  params: { slug: string };
}) {
  let profile: RegionRiskProfile;
  let timeline: RegionTimeline;
  try {
    [profile, timeline] = await Promise.all([
      api.riskProfile(params.slug),
      api.regionTimeline(params.slug),
    ]);
  } catch {
    notFound();
  }

  /*
    Binned here, at build time, rather than in the browser.

    DepthHistogram is a client component; passing the full event array to it
    just for five integers made React serialise all 903 events into the HTML
    for a region like Kepulauan Mentawai — 93.9 kB of a 350 kB page.
  */
  const depthBins = binByDepth(timeline.events);
  // `id` is read by nothing here — every field on a client component's props
  // ends up in the HTML, so only project what's actually plotted or read.
  const toSeismogramEvents = (events: RegionTimeline["events"]): SeismogramEvent[] =>
    events.map((e) => ({
      event_time: e.event_time,
      magnitude: e.magnitude,
      depth_km: e.depth_km,
      source: e.source,
    }));
  const seismogramEvents = toSeismogramEvents(timeline.events);

  /*
   * Default comparison reference for the seismogram (DESIGN.md §5.4): the
   * nearest of the app's three reference cities, resolved server-side so the
   * first paint already has a real comparison trace — no client fetch, no
   * loading flash. `SeismogramComparePicker` only re-fetches when the reader
   * picks a different reference.
   */
  const referenceCandidates = (
    await Promise.all(
      Object.values(REFERENCE_CITY_SLUGS)
        .filter((slug) => slug !== profile.region.slug)
        .map((slug) => api.region(slug).catch(() => null)),
    )
  ).filter((r): r is AdminRegion => r !== null);

  const nearestReference = referenceCandidates
    .map((region) => ({
      region,
      distanceKm: haversineKm(
        profile.region.longitude,
        profile.region.latitude,
        region.longitude,
        region.latitude,
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]?.region;

  const defaultReferenceEvents = nearestReference
    ? await api
        .regionTimeline(nearestReference.slug)
        .then((t) => toSeismogramEvents(t.events))
        .catch(() => [])
    : [];

  // Same source the old two-select `/compare` form used, minus this region.
  const leaderboardDesc = await api
    .leaderboard(50, "desc")
    .then((r) => r.results)
    .catch(() => []);
  const compareOptions = leaderboardDesc
    .map((r) => ({ slug: r.slug, name: r.region_name }))
    .filter((o) => o.slug !== profile.region.slug)
    .sort((a, b) => a.name.localeCompare(b.name));

  /*
   * Ranking context, absorbed from /explore's Leaderboard as a single
   * positioned row rather than a list (DESIGN.md §7 item 5, §10 step 5). The
   * export only ships the top 50 by score and the bottom 50 (`leaderboard`
   * asc/desc, both capped at 50) — for a region outside the top 50 desc, its
   * rank is recovered from the ascending list instead, since with ~52 scored
   * regions today the two lists together cover everyone even though neither
   * alone does.
   */
  const totalScored = profile.activity_percentile_basis?.region_count ?? leaderboardDesc.length;
  let rankRow = leaderboardDesc.find((r) => r.slug === profile.region.slug) ?? null;
  if (!rankRow && totalScored > leaderboardDesc.length) {
    const leaderboardAsc = await api
      .leaderboard(50, "asc")
      .then((r) => r.results)
      .catch(() => []);
    const ascMatch = leaderboardAsc.find((r) => r.slug === profile.region.slug);
    if (ascMatch) rankRow = { ...ascMatch, rank: totalScored - ascMatch.rank + 1 };
  }

  const scoreInputs = scoreInputsFromProfile(profile);

  /*
   * The finding in prose, not a stat row (DESIGN.md §7 item 2) — replaces the
   * four-StatTile row that used to sit here (skor/persentil/magnitudo/tsunami),
   * which was the dashboard reflex this rework exists to remove. The activity
   * score, percentile and tier now live in VerdictBand; the figures in the
   * two FactRows under it. This sentence states the M5+ record itself.
   */
  const coverage =
    profile.earliest_event_year && profile.latest_event_year
      ? `${profile.earliest_event_year}–${profile.latest_event_year}`
      : null;
  const coverageYears =
    profile.earliest_event_year && profile.latest_event_year
      ? profile.latest_event_year - profile.earliest_event_year
      : null;
  const largestEventYear = profile.largest_event
    ? new Date(profile.largest_event.event_time).getFullYear()
    : null;
  const headline = [
    coverageYears
      ? `Dalam ${coverageYears} tahun terakhir (${coverage}) tercatat ${num(profile.event_count_m5)} gempa M5 ke atas dalam radius 100 km dari ${profile.region.name}.`
      : `Tercatat ${num(profile.event_count_m5)} gempa M5 ke atas dalam radius 100 km dari ${profile.region.name}.`,
    profile.largest_magnitude != null && largestEventYear
      ? `Yang terbesar ${magnitude(profile.largest_magnitude)} pada ${largestEventYear}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const island = islandOf(profile.region.latitude, profile.region.longitude);
  const { latitude: lat, longitude: lng } = profile.region;

  return (
    <div className="space-y-12 sm:space-y-14">
      <RegionJsonLd profile={profile} />

      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-fluid-00 text-ink-3">
          <Link href="/regions" className="underline underline-offset-4 hover:text-ink">
            Wilayah
          </Link>{" "}
          / {island}
        </nav>

        {profile.composite_score != null ? (
          <VerdictBand
            headingLevel={1}
            eyebrow={`${regionType(profile.region.type)} · ${island}`}
            place={profile.region.name}
            meta={`Profil risiko historis dari ${num(profile.event_count_m4)} gempa M4+ dalam radius 100 km, ${coverage ?? "catatan historis"}.`}
            score={profile.composite_score}
            tier={profile.activity_tier}
            finding={headline}
            plotLabel={profile.region.name}
            plotSlug={profile.region.slug}
            action={
              <ShareButton
                path={`/region/${profile.region.slug}`}
                caption={`Risiko gempa ${profile.region.name}: ${riskTierLabel(
                  profile.activity_tier,
                )} (skor ${profile.composite_score.toFixed(0)}/100) menurut GempaWatch:`}
              />
            }
          />
        ) : (
          <PageHeader eyebrow={regionType(profile.region.type)} title={profile.region.name} subtitle={headline} />
        )}
      </div>

      <SectionNav
        items={[
          { id: "ringkasan", label: "Ringkasan" },
          { id: "rekaman", label: "Rekaman" },
          { id: "distribusi", label: "Distribusi" },
          { id: "kesiapsiagaan", label: "Kesiapsiagaan" },
          { id: "metodologi", label: "Metodologi" },
        ]}
      />

      <section id="ringkasan" aria-labelledby="h-ringkasan" className="scroll-mt-32">
        <h2 id="h-ringkasan" className="sr-only">
          Ringkasan
        </h2>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <figure className="m-0">
            <div className="gw-paper-grid h-[280px] overflow-hidden rounded-xl border border-rule sm:h-[320px]">
              <QuakeFieldCanvas
                className="h-full w-full"
                label={`Gempa M4.5+ sejak 1970 di sekitar ${profile.region.name}; yang berada dalam radius 100 km tetap berwarna.`}
                bbox={[lng - 3.4, lat - 2.4, lng + 3.4, lat + 2.4]}
                focus={{ lat, lon: lng, radiusKm: 100 }}
              />
            </div>
            <figcaption className="mt-2 text-fluid-000 leading-relaxed text-ink-3">
              Lingkaran = radius 100 km yang dihitung untuk wilayah ini. Gempa M4.5+ di dalamnya tetap
              berwarna menurut kedalaman; di luarnya dipudarkan.
            </figcaption>
          </figure>

          <div className="space-y-6">
            <FactRow
              facts={[
                { value: num(profile.event_count_m4), label: "gempa M4+ dalam 100 km" },
                { value: num(profile.event_count_m5), label: "di antaranya M5 ke atas" },
                { value: magnitude(profile.largest_magnitude), label: `terbesar${largestEventYear ? `, ${largestEventYear}` : ""}` },
                { value: depth(profile.avg_depth_km), label: "kedalaman rata-rata" },
              ]}
            />
            <FactRow
              facts={[
                {
                  value:
                    profile.nearest_fault_distance_km != null
                      ? `${profile.nearest_fault_distance_km.toFixed(0)} km`
                      : "—",
                  label: profile.nearest_fault_name ? `ke ${profile.nearest_fault_name}` : "sesar aktif terdekat",
                },
                {
                  value: profile.region.is_coastal ? (
                    <span className="text-fluid-2">
                      <RiskTierBadge tier={profile.tsunami_risk_tier} />
                    </span>
                  ) : (
                    "—"
                  ),
                  label: profile.region.is_coastal ? "riwayat tsunami (pesisir)" : "bukan wilayah pesisir",
                },
                { value: num(profile.event_count_m6), label: "gempa M6+" },
                { value: num(profile.event_count_m7_plus), label: "gempa M7+" },
              ]}
            />
            {rankRow && (
              <div>
                <h3 className="mb-2 text-fluid-00 font-semibold text-ink-2">Peringkat aktivitas</h3>
                <RegionRankRow row={rankRow} total={totalScored} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="rekaman" aria-labelledby="h-rekaman" className="scroll-mt-32">
        <h2 id="h-rekaman" className="text-fluid-3 font-extrabold tracking-tight">
          Rekaman gempa 1970–sekarang
        </h2>
        <p className="mb-5 mt-1 max-w-[75ch] text-fluid-00 leading-relaxed text-ink-2">
          {num(timeline.events.length)} kejadian tercatat. Satu garis per kejadian — tinggi menandai
          magnitudo, warna menandai kedalaman. Rentang tenang terpanjang dan gempa terbesar ditandai
          otomatis. Skala waktu dan magnitudo sama pada rekaman pembanding.
        </p>
        <SeismogramComparePicker
          regionName={profile.region.name}
          events={seismogramEvents}
          options={compareOptions}
          defaultReferenceSlug={nearestReference?.slug ?? ""}
          defaultReferenceName={nearestReference?.name ?? ""}
          defaultReferenceEvents={defaultReferenceEvents}
        />
      </section>

      <section id="distribusi" aria-labelledby="h-distribusi" className="scroll-mt-32">
        <h2 id="h-distribusi" className="text-fluid-3 font-extrabold tracking-tight">
          Distribusi
        </h2>
        <div className="mt-5 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-fluid-1 font-bold">Frekuensi magnitudo</h3>
            <p className="mb-3 mt-1 text-fluid-00 text-ink-2">
              Berapa banyak gempa di tiap tingkat kekuatan, sepanjang catatan.
            </p>
            <MagnitudeFreqChart profile={profile} />
          </div>
          <div>
            <h3 className="text-fluid-1 font-bold">Distribusi kedalaman</h3>
            <p className="mb-3 mt-1 text-fluid-00 text-ink-2">
              Kedalaman menentukan seberapa keras guncangan terasa di permukaan.
            </p>
            <DepthHistogram bins={depthBins} />
          </div>
        </div>
      </section>

      <section id="kesiapsiagaan" aria-labelledby="h-siap" className="scroll-mt-32">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <h2 id="h-siap" className="text-fluid-3 font-extrabold tracking-tight">
              Langkah kesiapsiagaan
            </h2>
            <p className="mt-1 text-fluid-00 leading-relaxed text-ink-2">
              Disesuaikan dengan tingkat aktivitas wilayah ini
              {profile.region.is_coastal ? " dan statusnya sebagai wilayah pesisir" : ""}. Yang bisa
              dilakukan hari ini — bukan karena gempa akan datang, tetapi karena kesiapan selalu berguna.
            </p>
          </div>
          <PreparednessChecklist
            tier={profile.activity_tier}
            coastal={profile.region.is_coastal}
            initialVisible={4}
          />
        </div>
      </section>

      <section id="metodologi" aria-labelledby="h-metodologi" className="scroll-mt-32">
        <h2 id="h-metodologi" className="text-fluid-3 font-extrabold tracking-tight">
          Bagaimana angka ini dibuat
        </h2>
        <p className="mb-4 mt-1 max-w-[70ch] text-fluid-00 text-ink-2">
          Setiap angka di halaman ini bisa ditelusuri ke aturannya.
        </p>
        <DisclosureGroup>
          {scoreInputs && (
            <Disclosure
              title={`Dari mana skor ${Math.round(profile.composite_score ?? 0)} datang`}
              summary="Empat komponen berbobot, dari catatan gempa dalam radius 100 km"
            >
              <ScoreBreakdown components={scoreBreakdown(scoreInputs)} total={profile.composite_score ?? 0} />
            </Disclosure>
          )}
          <Disclosure title="Cakupan data" summary={`${coverage ?? "—"} · ${num(profile.event_count_m4)} gempa M4+`}>
            <CoverageNote
              earliestYear={profile.earliest_event_year}
              latestYear={profile.latest_event_year}
              years={scoreInputs?.coverageYears ?? 0}
              m4Count={profile.event_count_m4}
              scope="region"
            />
          </Disclosure>
          <Disclosure title="Apa arti tingkat aktivitas" summary={riskTierLabel(profile.activity_tier)}>
            <p className="max-w-[70ch] text-fluid-00 leading-relaxed text-ink-2">
              {activityTierMeaning(profile.activity_tier)} Jumlah kejadian dihitung dalam radius tetap
              100 km dan <em>tidak</em> dinormalisasi terhadap luas wilayah maupun populasi — gunakan
              persentil untuk perbandingan relatif. Indikator pola historis, bukan prediksi.
            </p>
          </Disclosure>
        </DisclosureGroup>
      </section>

      <footer className="space-y-4">
        <p className="max-w-[80ch] border-l-2 border-rule-strong pl-3 text-fluid-00 leading-relaxed text-ink-3">
          GempaWatch membaca pola gempa masa lalu. Ini bukan sistem peringatan dini dan bukan prediksi.
          Untuk peringatan gempa dan tsunami resmi, rujuk{" "}
          <a
            href="https://www.bmkg.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-2 underline underline-offset-2"
          >
            bmkg.go.id ↗
          </a>
        </p>
        <SourceAttribution />
        {/* No "Bandingkan dengan wilayah lain" button — the record section
            above already compares inline. */}
        <ButtonLink href="/" variant="secondary">
          Cek titik persismu di peta →
        </ButtonLink>
      </footer>
    </div>
  );
}

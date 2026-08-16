import Link from "next/link";
import { api } from "@/lib/api";
import type { HistoricalDisaster, LeaderboardRow } from "@/lib/types";
import { LiveTicker } from "@/components/map/LiveTicker";
import { RiskCheckTool } from "@/components/risk/RiskCheckTool";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { scoreBreakdown, scoreInputsFromProfile } from "@/lib/engine/scoring";
import { magnitude, shortDate } from "@/lib/format";
import { pageMetadata } from "@/lib/meta";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const revalidate = 300; // 5 min, matching BMKG cadence

/*
  The homepage inherits the layout's title and description — they are the site's
  own — but it had no canonical and no og:url, so nothing declared which URL is
  the real one. Reusing the layout constants keeps a single source.
*/
export const metadata = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  // Each block degrades on its own — a leaderboard outage should not cost the
  // reader the live ticker, and vice versa.
  const [events, top, disasters, example] = await Promise.all([
    api
      .liveEvents()
      .then((d) => d.results)
      .catch(() => null),
    api
      .leaderboard(5, "desc")
      .then((r) => r.results)
      .catch(() => [] as LeaderboardRow[]),
    api.disasterTimeline().catch(() => [] as HistoricalDisaster[]),
    // A real region, so the homepage can SHOW how a score is built instead of
    // only naming what one contains.
    api.riskProfile("kota-yogyakarta").catch(() => null),
  ]);

  const loadFailed = events === null;
  const list = events ?? [];
  const exampleInputs = example ? scoreInputsFromProfile(example) : null;

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------
          The homepage IS the risk check (DESIGN.md §1 decision 1, §2.2): the
          product's question, asked and answered on one screen, no navigation
          between the two. This used to be a headline over a name-search field
          that sent a reader to /risk-check for the actual tool — a live map
          and a 24h stat-tile row sat between the question and its answer.
          RiskCheckTool already orchestrates the picker map, geolocation, five
          shortcut cities and an in-place idle/loading/error/report state
          union; it moved here unchanged (DESIGN.md §6).
         ------------------------------------------------------------------ */}
      <section className="animate-fade-in-up relative rounded-2xl border border-earth-border bg-earth-surface px-5 py-8 shadow-raised sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-seismic-orange/[0.07] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, transparent 0 26px, rgba(232,116,59,0.045) 26px 27px)",
            maskImage: "linear-gradient(to left, black, transparent 55%)",
            WebkitMaskImage: "linear-gradient(to left, black, transparent 55%)",
          }}
        />

        <div className="relative space-y-6">
          <div className="max-w-3xl">
            <h1 className="text-fluid-5 font-bold tracking-tight">
              Seberapa rawan gempa{" "}
              <span className="text-seismic-orange">lokasi kamu?</span>
            </h1>
            <p className="mt-4 max-w-2xl text-fluid-1 leading-relaxed text-text-secondary">
              Pilih titik di peta, dan dapatkan{" "}
              <strong className="font-semibold text-text-primary">
                skor paparan 0–100
              </strong>{" "}
              yang dihitung dari lebih dari 50 tahun catatan gempa BMKG dan
              USGS — pola historis titikmu sendiri, bukan sekadar daftar gempa
              terbaru, dan bukan ramalan.
            </p>
          </div>

          <RiskCheckTool />

          <p className="max-w-2xl border-t border-earth-border pt-4 text-fluid-00 leading-relaxed text-text-muted">
            <strong className="font-semibold text-risk-amber">Penting —</strong>{" "}
            GempaWatch membaca pola gempa masa lalu. Ini{" "}
            <strong className="font-semibold text-text-secondary">
              bukan sistem peringatan dini
            </strong>{" "}
            dan bukan prediksi. Untuk peringatan gempa dan tsunami resmi, selalu
            rujuk{" "}
            <a
              href="https://www.bmkg.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-seismic-bright underline underline-offset-2 hover:brightness-110"
            >
              bmkg.go.id
            </a>
            .
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          The live feed's entire footprint here now — a strip, not a 440px map
          card (DESIGN.md §5.3, §8). It is evidence that the record is live,
          not a second thing to read before the question above. A map of
          recent events genuinely belongs on /map, where HazardMap plots them
          as one of its toggleable layers.
         ------------------------------------------------------------------ */}
      <LiveTicker events={list} loadFailed={loadFailed} />

      {/* ------------------------------------------------------------------
          A worked example, before the reader has typed anything.

          One real region, its four terms, its published total — shows what
          the product does with fifty years of records, for a visitor who
          hasn't picked a point yet.
         ------------------------------------------------------------------ */}
      {exampleInputs && example?.composite_score != null && (
        <section>
          <Card
            title={`Contoh: bagaimana skor ${example.region.name} tersusun`}
            subtitle="Satu wilayah nyata, dari catatan gempa mentah sampai satu angka. Aturan yang sama dipakai untuk lokasi mana pun."
            action={
              <Link
                href="/about#skor-lab"
                className="text-fluid-000 text-text-secondary transition-colors hover:text-seismic-bright"
              >
                Coba ubah angkanya →
              </Link>
            }
          >
            <ScoreBreakdown
              components={scoreBreakdown(exampleInputs)}
              total={example.composite_score}
            />
          </Card>
        </section>
      )}

      {/* Discovery + history: two ways to leave the homepage with something. */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Wilayah paling aktif"
          subtitle="Skor 0–100 menimbang frekuensi, magnitudo, kedalaman, dan kedekatan sesar."
          action={
            <Link
              href="/explore"
              className="text-fluid-000 text-text-secondary transition-colors hover:text-seismic-bright"
            >
              Lihat semua →
            </Link>
          }
        >
          <Leaderboard rows={top} variant="compact" />
        </Card>

        <Card
          title="Memori bencana"
          subtitle="Kejadian yang membentuk kesadaran kebencanaan Indonesia."
          action={
            <Link
              href="/timeline"
              className="text-fluid-000 text-text-secondary transition-colors hover:text-seismic-bright"
            >
              Linimasa lengkap →
            </Link>
          }
        >
          {disasters.length === 0 ? (
            <EmptyState title="Arsip bencana belum tersedia." />
          ) : (
            <ul className="divide-y divide-earth-border/70">
              {disasters.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-baseline gap-3 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-fluid-000 tabular-nums text-text-muted">
                    {shortDate(d.event_date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-fluid-00 text-text-primary">
                    {d.name}
                  </span>
                  <span className="shrink-0 font-mono text-fluid-000 tabular-nums text-seismic-bright">
                    {magnitude(d.magnitude)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

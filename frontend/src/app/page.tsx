import Link from "next/link";
import { api } from "@/lib/api";
import type { HistoricalDisaster, LeaderboardRow } from "@/lib/types";
import { RiskCheckTool } from "@/components/risk/RiskCheckTool";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { EmptyState } from "@/components/ui/EmptyState";
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

function ExploreColumn({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 border-t-2 border-ink pt-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-fluid-1 font-extrabold tracking-tight">{title}</h2>
        <Link href={href} className="shrink-0 text-fluid-00 font-semibold text-ink underline underline-offset-4 hover:no-underline">
          {linkLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  // Each block degrades on its own — an outage in one export file should not
  // cost the reader the others.
  const [top, disasters] = await Promise.all([
    api
      .leaderboard(5, "desc")
      .then((r) => r.results)
      .catch(() => [] as LeaderboardRow[]),
    api.disasterTimeline().catch(() => [] as HistoricalDisaster[]),
  ]);

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* The question, the record behind it, and the answer in place
          (DESIGN.md §2.2, §6, §13). The live feed is not here: its job — "is
          this current?" — is the "Gempa terkini" pill in the nav. */}
      <RiskCheckTool />

      {/* Three ways to leave with something, as ruled columns rather than
          cards: the most active regions, the disaster archive, the method. */}
      <div className="grid gap-10 lg:grid-cols-3">
        <ExploreColumn title="Wilayah paling aktif" href="/regions" linkLabel="Semua wilayah →">
          <Leaderboard rows={top} variant="compact" />
        </ExploreColumn>

        <ExploreColumn title="Memori bencana" href="/timeline" linkLabel="Sejarah →">
          {disasters.length === 0 ? (
            <EmptyState title="Arsip bencana belum tersedia." />
          ) : (
            <ul className="divide-y divide-rule">
              {disasters.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-baseline gap-3 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-fluid-000 tabular-nums text-ink-3">
                    {shortDate(d.event_date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-fluid-00 font-medium text-ink">{d.name}</span>
                  <span className="shrink-0 text-fluid-00 font-bold tabular-nums text-ink">
                    {magnitude(d.magnitude)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ExploreColumn>

        <ExploreColumn title="Cara skor dihitung" href="/about" linkLabel="Metodologi →">
          <div className="space-y-3 text-fluid-00 leading-relaxed text-ink-2">
            <p>
              Empat komponen dari catatan gempa dalam radius 100 km: seberapa sering, seberapa besar
              yang terbesar, berapa banyak yang dangkal, dan seberapa dekat sesar aktif.
            </p>
            <p>
              Bobotnya terbuka. Ubah sendiri di{" "}
              <Link href="/about#skor-lab" className="font-semibold text-ink underline underline-offset-4">
                ScoreLab
              </Link>{" "}
              dan lihat skornya bergerak.
            </p>
            <p className="text-ink-3">
              GempaWatch membaca pola masa lalu. Ini bukan sistem peringatan dini; peringatan resmi
              hanya dari{" "}
              <a
                href="https://www.bmkg.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                BMKG
              </a>
              .
            </p>
          </div>
        </ExploreColumn>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/**
 * Site footer.
 *
 * Three tiers, in deliberate order of legal weight: sitemap (navigation),
 * the BMKG/USGS attribution and the not-a-warning-system disclaimer (both
 * mandatory, so they get a bordered panel rather than fine print), and finally
 * the author byline passed in as children — kept visually separate so it can
 * never read as part of the data attribution.
 */

/*
 * Five public destinations (DESIGN.md §4): "Peringkat wilayah" (/explore) and
 * "Bandingkan wilayah" (/compare) retired here once their jobs moved onto
 * region pages — a ranking row and an inline comparison trace respectively
 * (§10 steps 3 and 5) — and "Cek risiko lokasi saya" now just points at "/",
 * where the tool itself lives, so it reads as "Beranda" instead of a second
 * link to the same page under a different label.
 */
const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Jelajahi",
    links: [
      { href: "/", label: "Cek lokasi" },
      { href: "/regions", label: "Wilayah" },
      { href: "/map", label: "Peta bahaya & sesar" },
    ],
  },
  {
    title: "Pahami",
    links: [
      { href: "/timeline", label: "Memori bencana" },
      { href: "/about", label: "Metodologi & sumber data" },
    ],
  },
];

const OFFICIAL = [
  { href: "https://www.bmkg.go.id/", label: "BMKG — peringatan resmi" },
  { href: "https://earthquake.usgs.gov/", label: "USGS Earthquake Hazards" },
  { href: "https://bnpb.go.id/", label: "BNPB — kesiapsiagaan bencana" },
];

export function SiteFooter({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="mt-20 border-t border-rule bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size={26} className="text-fluid-00" />
            <p className="mt-3 max-w-xs text-fluid-00 leading-relaxed text-ink-2">
              Intelijen risiko gempa untuk Indonesia. Data resmi BMKG dan arsip
              historis USGS, dibaca sebagai pola — bukan ramalan.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="font-display text-fluid-000 font-semibold uppercase tracking-[0.14em] text-ink-3">
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-fluid-00 text-ink-2 transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Sumber resmi">
            <h2 className="font-display text-fluid-000 font-semibold uppercase tracking-[0.14em] text-ink-3">
              Sumber resmi
            </h2>
            <ul className="mt-3 space-y-2">
              {OFFICIAL.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fluid-00 text-ink-2 transition-colors hover:text-ink"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-l-2 border-ink pl-4">
          <p className="max-w-[80ch] text-fluid-00 leading-relaxed text-ink-2">
            <strong className="font-bold text-ink">Penting —</strong>{" "}
            GempaWatch menampilkan pola risiko historis, bukan prediksi, dan{" "}
            <strong className="font-semibold text-ink">bukan pengganti</strong>{" "}
            peringatan dini resmi BMKG. Untuk peringatan tsunami resmi, selalu rujuk{" "}
            <a
              href="https://www.bmkg.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline underline-offset-2 hover:brightness-110"
            >
              bmkg.go.id
            </a>
            .
          </p>
        </div>

        <p className="mt-5 border-t border-rule pt-5 text-fluid-000 leading-relaxed text-ink-3">
          Data: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) &middot; USGS
          (United States Geological Survey). Atribusi BMKG bersifat wajib pada setiap
          tampilan datanya.
        </p>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </footer>
  );
}

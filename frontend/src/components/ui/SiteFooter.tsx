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

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Jelajahi",
    links: [
      { href: "/", label: "Beranda" },
      { href: "/explore", label: "Peringkat wilayah" },
      { href: "/compare", label: "Bandingkan wilayah" },
      { href: "/map", label: "Peta bahaya & sesar" },
    ],
  },
  {
    title: "Pahami",
    links: [
      { href: "/risk-check", label: "Cek risiko lokasi saya" },
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
    <footer className="mt-20 border-t border-earth-border bg-earth-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size={26} className="text-fluid-00" />
            <p className="mt-3 max-w-xs text-fluid-00 leading-relaxed text-text-secondary">
              Intelijen risiko gempa untuk Indonesia. Data resmi BMKG dan arsip
              historis USGS, dibaca sebagai pola — bukan ramalan.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="font-display text-fluid-000 font-semibold uppercase tracking-[0.14em] text-text-muted">
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-fluid-00 text-text-secondary transition-colors hover:text-seismic-bright"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Sumber resmi">
            <h2 className="font-display text-fluid-000 font-semibold uppercase tracking-[0.14em] text-text-muted">
              Sumber resmi
            </h2>
            <ul className="mt-3 space-y-2">
              {OFFICIAL.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fluid-00 text-text-secondary transition-colors hover:text-seismic-bright"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 rounded-lg border border-risk-amber/25 bg-risk-amber/[0.06] px-4 py-3.5">
          <p className="text-fluid-00 leading-relaxed text-text-secondary">
            <strong className="font-semibold text-risk-amber">Penting —</strong>{" "}
            GempaWatch menampilkan pola risiko historis, bukan prediksi, dan{" "}
            <strong className="font-semibold text-text-primary">bukan pengganti</strong>{" "}
            peringatan dini resmi BMKG. Untuk peringatan tsunami resmi, selalu rujuk{" "}
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

        <p className="mt-5 border-t border-earth-border pt-5 text-fluid-000 leading-relaxed text-text-muted">
          Data: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) &middot; USGS
          (United States Geological Survey). Atribusi BMKG bersifat wajib pada setiap
          tampilan datanya.
        </p>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </footer>
  );
}

import Link from "next/link";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/explore", label: "Jelajahi" },
  { href: "/map", label: "Peta Bahaya" },
  { href: "/timeline", label: "Sejarah" },
  { href: "/risk-check", label: "Cek Risiko" },
  { href: "/about", label: "Tentang" },
];

export function NavHeader() {
  return (
    <header className="sticky top-0 z-[1000] border-b border-earth-border bg-earth-dark/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-seismic-orange" />
          <span className="font-semibold tracking-tight text-text-primary">
            GEMPA<span className="text-seismic-orange">WATCH</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-1.5 text-text-secondary hover:bg-earth-surface hover:text-text-primary"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

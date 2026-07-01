"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/explore", label: "Jelajahi" },
  { href: "/map", label: "Peta Bahaya" },
  { href: "/timeline", label: "Sejarah" },
  { href: "/risk-check", label: "Cek Risiko" },
  { href: "/about", label: "Tentang" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-[1000] border-b border-earth-border bg-earth-dark/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="GempaWatch beranda"
        >
          <span className="relative inline-flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-seismic-orange" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-seismic-orange" />
          </span>
          <span className="font-semibold tracking-tight text-text-primary">
            GEMPA<span className="text-seismic-orange">WATCH</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 text-sm md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 transition-colors duration-[130ms] ${
                  active
                    ? "bg-earth-surface text-seismic-orange"
                    : "text-text-secondary hover:bg-earth-surface hover:text-text-primary"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-earth-surface hover:text-text-primary md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <path d="M5 5l10 10" />
                <path d="M15 5L5 15" />
              </>
            ) : (
              <>
                <path d="M3 6h14" />
                <path d="M3 10h14" />
                <path d="M3 14h14" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-nav"
          className="animate-fade-in border-t border-earth-border bg-earth-dark px-4 py-2 md:hidden"
        >
          <div className="flex flex-col">
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-earth-surface text-seismic-orange"
                      : "text-text-secondary hover:bg-earth-surface hover:text-text-primary"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

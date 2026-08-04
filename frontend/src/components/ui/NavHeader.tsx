"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * Primary navigation.
 *
 * "Cek Risiko" is pulled out of the link row and rendered as the one solid
 * button on the page, because it is the single action the whole product exists
 * to deliver — everything else is browsing. The active link is marked with an
 * underline rule rather than a filled chip, so the orange fill stays unique to
 * that call to action.
 */

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/explore", label: "Jelajahi" },
  { href: "/map", label: "Peta Bahaya" },
  { href: "/timeline", label: "Sejarah" },
  { href: "/about", label: "Tentang" },
];

const CTA = { href: "/risk-check", label: "Cek Risiko" };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // The header only earns its border and shadow once content is behind it —
  // at the top of the page it should sit flush with the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A menu open behind a scrolling page is disorienting on mobile.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-[1000] bg-earth-dark/85 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? "border-b border-earth-border shadow-md" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="GempaWatch beranda"
        >
          <Logo size={28} className="text-[0.9375rem]" />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-0.5 text-sm md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-md px-3 py-2 transition-colors duration-[130ms] ${
                  active
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {l.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-seismic-orange"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={CTA.href}
            aria-current={isActive(pathname, CTA.href) ? "page" : undefined}
            className="hidden rounded-lg bg-seismic-orange px-4 py-2 text-sm font-semibold text-earth-dark shadow-glow transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98] sm:inline-flex"
          >
            {CTA.label}
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-earth-surface hover:text-text-primary md:hidden"
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
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-nav"
          className="animate-fade-in border-t border-earth-border bg-earth-dark px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-0.5">
            {[...LINKS, CTA].map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-md px-3 py-3 text-[0.9375rem] transition-colors ${
                    active
                      ? "bg-earth-surface text-seismic-bright"
                      : "text-text-secondary hover:bg-earth-surface hover:text-text-primary"
                  }`}
                >
                  {l.label}
                  <span aria-hidden="true" className="text-text-muted">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { LivePill } from "@/components/map/LiveDrawer";

/**
 * Primary navigation — five destinations named for what people want to do
 * (DESIGN.md §4, §13): check a place, browse regions, explore the map, read
 * the history, audit the method.
 *
 * - "Wilayah" (/regions) restores a browsable way into the region pages,
 *   which had only name search after /explore retired.
 * - "Tentang" became "Metodologi": that page's job is audit (ScoreLab,
 *   sources, rules), and the name now says so. The path stays /about.
 * - "Gempa terkini" is a pill, not a link: the latest event and how long ago,
 *   opening the 24-hour list in a drawer. It answers "is this current?" on
 *   every page without putting the feed back on the homepage (§12).
 *
 * Phones get the same destinations as a bottom tab bar (thumb reach, 44px
 * targets) instead of a hamburger; the header keeps only the logo and pill.
 */
export const NAV_LINKS = [
  { href: "/", label: "Cek Lokasi", short: "Cek" },
  { href: "/regions", label: "Wilayah", short: "Wilayah" },
  { href: "/map", label: "Peta", short: "Peta" },
  { href: "/timeline", label: "Sejarah", short: "Sejarah" },
  { href: "/about", label: "Metodologi", short: "Metode" },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/risk");
  if (href === "/regions") return pathname.startsWith("/regions") || pathname.startsWith("/region/");
  return pathname.startsWith(href);
}

export function NavHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // The header only earns its rule once content is behind it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[1000] bg-paper/85 backdrop-blur-md transition-[border-color] duration-200 ${
        scrolled ? "border-b border-rule" : "border-b border-transparent"
      }`}
    >
      <nav aria-label="Utama" className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="GempaWatch — cek lokasi">
          <Logo size={28} className="text-fluid-0" />
        </Link>

        <ul className="hidden flex-1 items-center gap-0.5 text-fluid-00 md:flex">
          {NAV_LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-tap-comfortable items-center px-3 transition-colors duration-[130ms] ${
                    active
                      ? "font-semibold text-ink shadow-[inset_0_-2px_0_rgb(var(--ink-c))]"
                      : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex min-w-0 items-center md:ml-0">
          <LivePill />
        </div>
      </nav>
    </header>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  "/": (
    <>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    </>
  ),
  "/regions": (
    <>
      <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="4" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="14" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  "/map": (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  "/timeline": <path d="M2.5 12h4l2.5-7 4.5 14 2.5-7h5.5" />,
  "/about": (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.4" />
    </>
  ),
};

/** Phone navigation: the five destinations in thumb reach. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Utama"
      className="fixed inset-x-0 bottom-0 z-[1000] border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-fluid-000 font-semibold ${
                  active ? "text-ink" : "text-ink-3"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.2 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[l.href]}
                </svg>
                {l.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";

interface Props {
  items: { id: string; label: string }[];
}

/**
 * Sticky in-page contents for long pages (the region profile): plain anchor
 * links that stay under the site header and underline the section in view.
 * Not tabs — every section stays on the page, so search, print and screen
 * readers see all of it; this only shortens the scroll.
 */
export function SectionNav({ items }: Props) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => e !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      // The band just under the sticky headers counts as "in view".
      { rootMargin: "-120px 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Bagian halaman"
      className="sticky top-[57px] z-[900] -mx-4 border-b border-rule bg-paper/90 px-4 backdrop-blur-md sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? "location" : undefined}
              className={`inline-flex min-h-tap-comfortable items-center px-3 text-fluid-00 transition-colors ${
                active === i.id
                  ? "font-bold text-ink shadow-[inset_0_-2px_0_rgb(var(--ink-c))]"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

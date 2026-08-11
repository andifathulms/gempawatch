"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { regionType } from "@/lib/format";
import type { AdminRegion } from "@/lib/types";

interface Props {
  /** `lg` is the homepage hero field; `md` fits inside a page header or card. */
  size?: "md" | "lg";
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Debounced region search — the primary discovery path into the product.
 *
 * Implemented as a combobox rather than an input with a floating list: arrow
 * keys move a highlight, Enter opens the highlighted region, Escape dismisses,
 * and the aria-activedescendant wiring means a screen reader announces the
 * option under the cursor. Previously the only way in was a mouse click, which
 * made the site's main entry point keyboard-inaccessible.
 */
export function RegionSearch({
  size = "md",
  placeholder = "Cari kabupaten/kota… (mis. Palu, Bandung, Bantul)",
  autoFocus,
}: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AdminRegion[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await api.searchRegions(q.trim());
        setResults(r);
        setCursor(0);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  // Clicking anywhere else dismisses the list — without this it survives until
  // the next keystroke and covers whatever the reader clicked towards.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = useCallback(
    (region: AdminRegion) => {
      setOpen(false);
      router.push(`/region/${region.slug}`);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const lg = size === "lg";
  const noMatches = open && !searching && q.trim().length >= 2 && results.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <svg
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-muted ${lg ? "left-4" : "left-3.5"}`}
        width={lg ? 18 : 16}
        height={lg ? 18 : 16}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" strokeLinecap="round" />
      </svg>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => (results.length || noMatches) && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Cari kabupaten atau kota"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && results.length ? `${listId}-opt-${cursor}` : undefined
        }
        className={`w-full rounded-lg border border-earth-border bg-earth-dark/60 text-text-primary shadow-sm transition-colors placeholder:text-text-muted focus:border-seismic-orange focus:outline-none ${
          lg
            ? "py-3.5 pl-12 pr-4 text-fluid-0 sm:text-fluid-1"
            : "py-2.5 pl-10 pr-4 text-fluid-00"
        }`}
      />

      {searching && (
        <span
          aria-hidden="true"
          className={`absolute top-1/2 -translate-y-1/2 text-fluid-000 text-text-muted ${lg ? "right-4" : "right-3.5"}`}
        >
          …
        </span>
      )}

      {/* A listbox may only contain options, so the empty-state message is a
          sibling of the list rather than a childless li pretending to be one. */}
      {open && noMatches && (
        <div className="absolute z-[1200] mt-2 w-full rounded-lg border border-earth-border bg-earth-raised px-4 py-3 text-fluid-00 text-text-muted shadow-lg">
          Tidak ada wilayah cocok dengan “{q.trim()}”.
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-[1200] mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-earth-border bg-earth-raised py-1 shadow-lg"
        >
          {
            /*
              The option is the whole row, and it is deliberately NOT a button.
              A combobox driven by aria-activedescendant requires focus to stay
              on the input; a focusable child inside an option meant Tab landed
              inside the listbox, and the roving highlight and the real focus
              point at different rows (WCAG 4.1.2). Mouse activation works the
              same as before via onMouseDown — before the input's blur — while
              keyboard activation goes through the input's Enter handler, which
              is where the combobox pattern expects it.
            */
            results.map((r, i) => (
              <li
                key={r.id}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === cursor}
                onMouseEnter={() => setCursor(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus on the input
                  go(r);
                }}
                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-fluid-00 transition-colors ${
                  i === cursor ? "bg-earth-surface text-text-primary" : "text-text-secondary"
                }`}
              >
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 text-fluid-000 text-text-muted">
                  {regionType(r.type)}
                  {r.is_coastal ? " · pesisir" : ""}
                </span>
              </li>
            ))
          }
        </ul>
      )}
    </div>
  );
}

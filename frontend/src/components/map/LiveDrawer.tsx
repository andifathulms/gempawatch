"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { magnitude, timeAgo } from "@/lib/format";
import type { EarthquakeEvent } from "@/lib/types";
import { EventList } from "./EventList";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

let feedCache: Promise<EarthquakeEvent[] | null> | null = null;
function loadFeed() {
  if (!feedCache) {
    feedCache = api
      .liveEvents()
      .then((d) => d.results)
      .catch(() => null);
  }
  return feedCache;
}

/**
 * "Gempa terkini": the live feed's whole footprint in the chrome.
 *
 * DESIGN.md §5.3 says the feed's job in this product is evidence that the
 * record is live and the score current — not news. A pill in the nav does
 * that on every page (the latest event, how long ago) without the homepage
 * turning back into a feed; the full 24-hour list opens in a drawer on
 * request, with the BMKG/USGS merge note EventList already carries.
 */
export function LivePill({ compact = false }: { compact?: boolean }) {
  const [events, setEvents] = useState<EarthquakeEvent[] | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    loadFeed().then((e) => alive && setEvents(e));
    return () => {
      alive = false;
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    pillRef.current?.focus();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const latest = events?.length
    ? events.reduce((a, b) => (b.event_time > a.event_time ? b : a))
    : null;
  const failed = events === null;

  return (
    <>
      <button
        ref={pillRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex min-h-[36px] max-w-full items-center gap-2 rounded-full border border-rule-strong bg-surface px-3 text-fluid-000 text-ink-2 transition-colors hover:border-ink hover:text-ink"
      >
        <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
          {!failed && (
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-depth-shallow-fill" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${failed ? "bg-ink-3" : "bg-depth-shallow-fill"}`} />
        </span>
        {latest ? (
          <>
            <span className="font-mono font-medium tabular-nums text-ink">{magnitude(latest.magnitude)}</span>
            {!compact && (
              <span className="min-w-0 truncate">
                <span className="sr-only">Gempa terkini: </span>
                {timeAgo(latest.event_time)}
              </span>
            )}
          </>
        ) : (
          <span>{failed ? "Data langsung tidak tersedia" : "Gempa terkini"}</span>
        )}
      </button>

      {/* Portalled to <body>: the sticky header's backdrop-filter makes it the
          containing block for fixed descendants, which trapped the drawer
          inside the header's box. */}
      {open &&
        createPortal(
        <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true" aria-labelledby="live-title">
          <button
            type="button"
            aria-label="Tutup"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/30 animate-fade-in"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md animate-fade-in flex-col border-l border-rule bg-paper shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <div>
                <h2 id="live-title" className="text-fluid-2 font-extrabold tracking-tight">
                  Gempa terkini
                </h2>
                <p className="mt-0.5 text-fluid-00 text-ink-2">
                  {latest
                    ? `${events?.length} gempa tercatat 24 jam terakhir · terbaru ${timeAgo(latest.event_time)}`
                    : failed
                      ? "Data langsung sementara tidak tersedia."
                      : "Tidak ada gempa tercatat 24 jam terakhir."}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="min-h-tap-comfortable min-w-tap-comfortable rounded-lg text-fluid-2 text-ink-2 hover:bg-raised hover:text-ink"
                aria-label="Tutup daftar gempa terkini"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {events && <EventList events={events} />}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <SourceAttribution variant="inline" />
              <Link href="/map" className="text-fluid-00 font-semibold text-ink underline underline-offset-4">
                Lihat di peta →
              </Link>
            </div>
            <p className="border-t border-rule px-5 py-3 text-fluid-000 leading-relaxed text-ink-3">
              Bukan sistem peringatan dini. Peringatan gempa &amp; tsunami resmi hanya dari{" "}
              <a href="https://www.bmkg.go.id/" target="_blank" rel="noopener noreferrer" className="underline">
                BMKG
              </a>
              .
            </p>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

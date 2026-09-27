"use client";

import { useState } from "react";
import Link from "next/link";
import { EventList } from "./EventList";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { magnitude, num } from "@/lib/format";
import type { EarthquakeEvent } from "@/lib/types";

interface Props {
  events: EarthquakeEvent[];
  loadFailed: boolean;
}

/**
 * The live feed's whole footprint on the homepage now (DESIGN.md §5.3): a
 * thin strip, not the old 440px map card. Its job here is evidence — the
 * record is live and the score above it is current — not news, so it states
 * a one-line summary and stays collapsed until asked.
 *
 * `EventList` is what it expands into, unchanged: the ticker is a new frame
 * around it, not a rewrite of it.
 */
export function LiveTicker({ events, loadFailed }: Props) {
  const [open, setOpen] = useState(false);

  const largest = events.length
    ? events.reduce((a, b) => (b.magnitude > a.magnitude ? b : a))
    : null;

  return (
    <section
      aria-label="Gempa 24 jam terakhir"
      className="rounded-xl border border-rule bg-surface"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full min-h-tap items-center gap-3 px-4 py-3 text-left sm:px-5"
      >
        <span className="relative inline-flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full ${loadFailed ? "bg-tier-mod" : "bg-tier-low"}`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${loadFailed ? "bg-tier-mod" : "bg-tier-low"}`}
          />
        </span>

        <span className="min-w-0 flex-1 truncate text-fluid-00 text-ink-2">
          {loadFailed ? (
            "Data langsung sementara tidak tersedia"
          ) : (
            <>
              <strong className="font-semibold text-ink">
                {num(events.length)} gempa
              </strong>{" "}
              tercatat 24 jam terakhir
              {largest && (
                <>
                  {" "}
                  · terbesar{" "}
                  <span className="font-mono tabular-nums text-ink">
                    {magnitude(largest.magnitude)}
                  </span>{" "}
                  {largest.location_description}
                </>
              )}
            </>
          )}
        </span>

        <span aria-hidden="true" className="shrink-0 text-fluid-000 text-ink-3">
          {open ? "Tutup ▲" : "Lihat daftar ▾"}
        </span>
      </button>

      {open && (
        <div className="border-t border-rule px-4 py-3 sm:px-5">
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <EventList events={events} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
            <SourceAttribution variant="inline" />
            <Link
              href="/map"
              className="text-fluid-000 text-ink-2 transition-colors hover:text-ink"
            >
              Peta bahaya lengkap →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

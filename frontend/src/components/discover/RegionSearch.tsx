"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AdminRegion } from "@/lib/types";

// Debounced region search — the only discovery path today besides pin-drop.
export function RegionSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AdminRegion[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const r = await api.searchRegions(q.trim());
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Cari kabupaten/kota… (mis. Palu, Bandung)"
        className="w-full rounded-lg border border-earth-border bg-earth-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-seismic-orange focus:outline-none"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-[1200] mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-earth-border bg-earth-raised shadow-xl">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push(`/region/${r.slug}`);
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-earth-surface"
              >
                <span className="text-text-primary">{r.name}</span>
                <span className="text-xs text-text-muted">{r.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

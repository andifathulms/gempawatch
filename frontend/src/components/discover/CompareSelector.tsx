"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Option {
  slug: string;
  name: string;
}

/**
 * Two dropdowns → navigate to /compare?a=&b=. Options are passed in from the
 * server (the leaderboard covers every scored region) to avoid a client
 * round-trip. The current selection is read from the URL here rather than
 * handed down as a prop, because the page is a single static file that cannot
 * know it.
 *
 * The <select> is a module-level component. It used to be declared inside the
 * body of this one, so every keystroke produced a new component type and React
 * remounted the field — which dropped focus mid-selection.
 */
function Select({
  value,
  onChange,
  label,
  exclude,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  /** The other side's choice; a region cannot be compared with itself. */
  exclude: string;
  options: Option[];
}) {
  return (
    <label className="flex-1">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-earth-border bg-earth-dark/60 px-3 py-2.5 text-sm text-text-primary transition-colors focus:border-seismic-orange focus:outline-none"
      >
        <option value="">Pilih wilayah…</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug} disabled={o.slug === exclude}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CompareSelector({ options }: { options: Option[] }) {
  const searchParams = useSearchParams();
  const [a, setA] = useState(searchParams.get("a") ?? "");
  const [b, setB] = useState(searchParams.get("b") ?? "");
  const router = useRouter();

  const go = () => {
    if (a && b && a !== b) router.push(`/compare?a=${a}&b=${b}`);
  };

  const swap = () => {
    setA(b);
    setB(a);
    if (a && b) router.push(`/compare?a=${b}&b=${a}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Select
        value={a}
        onChange={setA}
        label="Wilayah A"
        exclude={b}
        options={options}
      />

      <button
        type="button"
        onClick={swap}
        disabled={!a && !b}
        aria-label="Tukar posisi kedua wilayah"
        title="Tukar posisi"
        className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-earth-border text-text-muted transition-colors hover:border-seismic-orange hover:text-seismic-bright disabled:opacity-40 sm:mb-0"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 5h10l-2.5-2.5M14 11H4l2.5 2.5" />
        </svg>
      </button>

      <Select
        value={b}
        onChange={setB}
        label="Wilayah B"
        exclude={a}
        options={options}
      />

      <Button onClick={go} disabled={!a || !b || a === b} className="sm:shrink-0">
        Bandingkan
      </Button>
    </div>
  );
}

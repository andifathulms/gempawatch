"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Option {
  slug: string;
  name: string;
}

// Two dropdowns → navigate to /compare?a=&b=. Options are passed in from the
// server (leaderboard covers every scored region) to avoid a client round-trip.
export function CompareSelector({
  options,
  initialA,
  initialB,
}: {
  options: Option[];
  initialA?: string;
  initialB?: string;
}) {
  const [a, setA] = useState(initialA ?? "");
  const [b, setB] = useState(initialB ?? "");
  const router = useRouter();

  const go = () => {
    if (a && b && a !== b) router.push(`/compare?a=${a}&b=${b}`);
  };

  const Select = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-earth-border bg-earth-surface px-3 py-2.5 text-sm text-text-primary focus:border-seismic-orange focus:outline-none"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.slug} value={o.slug}>
          {o.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={a} onChange={setA} label="Wilayah A" />
      <span className="text-center text-text-muted">vs</span>
      <Select value={b} onChange={setB} label="Wilayah B" />
      <button
        onClick={go}
        disabled={!a || !b || a === b}
        className="shrink-0 rounded-lg bg-seismic-orange px-5 py-2.5 text-sm font-semibold text-earth-dark hover:brightness-110 disabled:opacity-50"
      >
        Bandingkan
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { RiskTier } from "@/lib/types";

// Turns anxiety into action — tier-tailored prep steps. The most ethical
// feature given the "never alarmist" mandate: it's about readiness, not fear.
const BASE_STEPS = [
  "Kenali titik aman di tiap ruangan (bawah meja kokoh, jauh dari kaca).",
  "Siapkan tas siaga: air, senter, P3K, dokumen penting, power bank.",
  "Sepakati titik kumpul keluarga & kontak darurat luar kota.",
  "Simpan nomor darurat: BNPB 117, ambulans 118/119.",
];

const COASTAL_STEPS = [
  "Kenali jalur evakuasi ke dataran tinggi terdekat (target: 30m di atas laut).",
  "Jika gempa kuat di pesisir, JANGAN tunggu sirene — segera menjauh dari pantai.",
  "Pahami tanda alam tsunami: air laut surut mendadak, gemuruh dari laut.",
];

const HIGH_TIER_STEPS = [
  "Periksa struktur rumah: angkur atap, lemari tinggi diikat ke dinding.",
  "Latih evakuasi keluarga minimal 2× setahun.",
];

/**
 * Priority order, because only the first three show at first: where to take
 * cover, then — on a coast — the one step that saves lives in a tsunami
 * (leave without waiting for a siren), then the go-bag.
 */
function stepsFor(tier: RiskTier | null, coastal: boolean): string[] {
  const [cover, bag, ...restBase] = BASE_STEPS;
  const [route, dontWait, signs] = COASTAL_STEPS;
  const steps = coastal ? [cover, dontWait, bag, route] : [cover, bag];
  steps.push(...restBase);
  if (tier === "HIGH") steps.push(...HIGH_TIER_STEPS);
  if (coastal) steps.push(signs);
  return steps;
}

interface Props {
  tier: RiskTier | null;
  coastal?: boolean;
  /**
   * Show only the first N steps until the reader asks for the rest — under a
   * result, three concrete actions land better than a wall of nine.
   */
  initialVisible?: number;
}

const STORAGE_KEY = "gw-siap-gempa";

/**
 * Progress is kept per browser, keyed by the step text, so ticking "tas
 * siaga" on one report stays ticked on the next place checked — the steps are
 * about the household, not the coordinate. Storage can be missing or refused
 * (private mode, blocked site data); the list still works, it just forgets.
 */
function loadDone(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function saveDone(done: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(done)));
  } catch {
    /* storage unavailable — progress lasts for this visit only */
  }
}

export function PreparednessChecklist({ tier, coastal = false, initialVisible }: Props) {
  const steps = stepsFor(tier, coastal);
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] = useState(false);

  // Read after mount: the server has no storage, and reading during render
  // would make the first client paint disagree with the HTML.
  useEffect(() => setDone(loadDone()), []);

  const toggle = (step: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      saveDone(next);
      return next;
    });

  const count = steps.filter((s) => done.has(s)).length;
  const limit = initialVisible && !expanded ? initialVisible : steps.length;
  const hidden = steps.length - limit;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-fluid-00 font-semibold text-ink">
          {count} dari {steps.length} siap
        </p>
        <span className="text-fluid-000 text-ink-3">Tersimpan di perangkat ini</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-300"
          style={{ width: `${(count / steps.length) * 100}%` }}
        />
      </div>
      <ul className="divide-y divide-rule border-y border-rule">
        {steps.slice(0, limit).map((step) => {
          const on = done.has(step);
          return (
            <li key={step}>
              <label className="flex min-h-tap-comfortable cursor-pointer items-start gap-3 py-3 text-fluid-00">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(step)}
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[rgb(var(--ink-c))]"
                />
                <span className={on ? "text-ink-3 line-through" : "text-ink"}>{step}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="min-h-tap rounded-full border border-rule-strong px-3.5 py-1 text-fluid-00 text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          Lihat {hidden} langkah lainnya
        </button>
      )}
      <p className="text-fluid-000 text-ink-3">
        Checklist edukatif umum. Untuk panduan resmi, rujuk BNPB &amp; BMKG.
      </p>
    </div>
  );
}

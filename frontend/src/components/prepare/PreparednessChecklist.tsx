"use client";

import { useState } from "react";
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

function stepsFor(tier: RiskTier | null, coastal: boolean): string[] {
  const steps = [...BASE_STEPS];
  if (tier === "HIGH") steps.push(...HIGH_TIER_STEPS);
  if (coastal) steps.push(...COASTAL_STEPS);
  return steps;
}

interface Props {
  tier: RiskTier | null;
  coastal?: boolean;
}

export function PreparednessChecklist({ tier, coastal = false }: Props) {
  const steps = stepsFor(tier, coastal);
  const [checked, setChecked] = useState<boolean[]>(() => steps.map(() => false));
  const done = checked.filter(Boolean).length;

  const toggle = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Siap Gempa</h3>
        <span className="font-mono text-xs text-text-muted">
          {done}/{steps.length}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-earth-border">
        <div
          className="h-full bg-risk-green transition-all"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-2">
        {steps.map((step, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-risk-green"
              />
              <span className={checked[i] ? "text-text-muted line-through" : "text-text-secondary"}>
                {step}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-text-muted">
        Checklist edukatif umum. Untuk panduan resmi, rujuk BNPB & BMKG.
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ScoreBreakdown } from "@/components/risk/ScoreBreakdown";
import { computeCompositeScore, scoreBreakdown, scoreToTier } from "@/lib/engine/scoring";
import { riskTierLabel } from "@/lib/seismic";
import { num } from "@/lib/format";

export interface ScoreLabSeed {
  regionName: string;
  slug: string;
  faultName: string | null;
  coverageYears: number;
  eventsPerYear: number;
  largestMagnitude: number;
  shallowRatio: number;
  faultDistanceKm: number;
  publishedScore: number;
}

interface Props {
  seed: ScoreLabSeed;
}

/** The four URL keys a shared what-if travels in. */
const KEYS = ["f", "m", "s", "d"] as const;

/**
 * A real region's score, worked end to end, that the reader can then pull apart.
 *
 * Two gaps this closes at once. The methodology page described the four rules
 * abstractly and never walked a single place from raw counts to a total, so a
 * newcomer could not follow the process before committing to a search. And
 * nothing anywhere was manipulable: the concept is a formula, formulas are
 * understood by perturbing them, and "what if the fault were further away?" had
 * no way to be asked even though the engine answers it in four lines.
 *
 * The seed is fetched live from the region's own published profile rather than
 * typed in here, so the worked example cannot drift from the number the region
 * page shows. Recomputation goes through the same engine functions the real
 * report uses — not a teaching copy of them — so nothing shown here can quietly
 * disagree with production.
 *
 * State lives in the URL: a reader who finds an interesting what-if can send it
 * to someone, and a refresh does not throw the exploration away.
 *
 * It is kept there with history.replaceState rather than useSearchParams,
 * because reading search params opts the whole subtree out of static rendering
 * — which for a *teaching* panel is the wrong trade. This way the worked
 * example is in the served HTML, readable before hydration and without
 * JavaScript at all; the sliders and any shared what-if activate on top of it.
 */
export function ScoreLab({ seed }: Props) {
  const [values, setValues] = useState({
    f: seed.eventsPerYear,
    m: seed.largestMagnitude,
    s: seed.shallowRatio,
    d: seed.faultDistanceKm,
  });
  const [touched, setTouched] = useState(false);

  // Adopt a shared what-if after mount. Server-rendered output stays the real
  // region's numbers, which is the correct thing to show a reader arriving cold.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const next = { ...values };
    let any = false;
    for (const k of KEYS) {
      const raw = q.get(k);
      if (raw === null) continue;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) continue;
      next[k] = parsed;
      any = true;
    }
    if (any) {
      setValues(next);
      setTouched(true);
    }
    // Runs once: this adopts the entry URL, it does not track later edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writeUrl = useCallback((next: Record<string, number>) => {
    const q = new URLSearchParams(window.location.search);
    for (const k of KEYS) q.set(k, String(next[k]));
    window.history.replaceState(null, "", `?${q.toString()}#skor-lab`);
  }, []);

  const setParam = useCallback(
    (key: string, value: number) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        writeUrl(next);
        return next;
      });
      setTouched(true);
    },
    [writeUrl],
  );

  const reset = useCallback(() => {
    const q = new URLSearchParams(window.location.search);
    for (const k of KEYS) q.delete(k);
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `?${qs}#skor-lab` : "#skor-lab");
    setValues({
      f: seed.eventsPerYear,
      m: seed.largestMagnitude,
      s: seed.shallowRatio,
      d: seed.faultDistanceKm,
    });
    setTouched(false);
  }, [seed]);

  const perYear = values.f;
  const largest = values.m;
  const shallow = values.s;
  const distance = values.d;

  // The engine takes an M4 count and a span, not a rate, so the rate the reader
  // moves is converted back the way the real pipeline would have produced it.
  const inputs = {
    m4Count: Math.round(perYear * seed.coverageYears),
    coverageYears: seed.coverageYears,
    largestMagnitude: largest,
    shallowRatio: shallow,
    nearestFaultDistanceKm: distance,
  };
  const total = computeCompositeScore(inputs);
  const components = scoreBreakdown(inputs);
  const tier = scoreToTier(total);
  const delta = Math.round((total - seed.publishedScore) * 10) / 10;

  const CONTROLS: Array<{
    key: string;
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
  }> = [
    {
      key: "f",
      label: "Gempa M4+ per tahun",
      value: perYear,
      min: 0,
      max: 12,
      step: 0.25,
      format: (v) => `${v.toLocaleString("id-ID")} per tahun`,
    },
    {
      key: "m",
      label: "Magnitudo terbesar tercatat",
      value: largest,
      min: 4,
      max: 9,
      step: 0.1,
      format: (v) => `M${v.toFixed(1)}`,
    },
    {
      key: "s",
      label: "Proporsi gempa dangkal",
      value: shallow,
      min: 0,
      max: 1,
      step: 0.01,
      format: (v) => `${Math.round(v * 100)}% di bawah 70 km`,
    },
    {
      key: "d",
      label: "Jarak ke sesar aktif terdekat",
      value: distance,
      min: 0,
      max: 200,
      step: 1,
      format: (v) => `${num(Math.round(v))} km`,
    },
  ];

  return (
    <div id="skor-lab" className="space-y-5 scroll-mt-24">
      <p className="text-fluid-00 leading-relaxed text-text-secondary">
        Ini bukan contoh karangan. Angka awalnya diambil langsung dari profil{" "}
        <Link
          href={`/region/${seed.slug}`}
          className="font-medium text-seismic-bright underline underline-offset-2"
        >
          {seed.regionName}
        </Link>
        : {num(inputs.m4Count)} gempa M4+ tercatat selama{" "}
        {num(seed.coverageYears)} tahun, terbesar M
        {seed.largestMagnitude.toFixed(1)}, {Math.round(seed.shallowRatio * 100)}%
        di antaranya lebih dangkal dari 70 km, dan sesar terdekat
        {seed.faultName ? ` (${seed.faultName})` : ""} berjarak{" "}
        {seed.faultDistanceKm.toLocaleString("id-ID")} km. Empat angka itu
        menghasilkan skor{" "}
        <span className="font-mono font-bold tabular-nums text-text-primary">
          {seed.publishedScore.toLocaleString("id-ID")}
        </span>
        .
      </p>

      <p className="text-fluid-00 leading-relaxed text-text-secondary">
        Geser mana pun di bawah ini untuk melihat bagian mana yang sebenarnya
        menggerakkan skor.
      </p>

      <div className="space-y-4 rounded-lg border border-earth-border bg-earth-dark/40 p-4">
        {CONTROLS.map((c) => (
          <div key={c.key}>
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={`lab-${c.key}`}
                className="text-fluid-00 text-text-secondary"
              >
                {c.label}
              </label>
              <span className="shrink-0 font-mono text-fluid-00 tabular-nums text-text-primary">
                {c.format(c.value)}
              </span>
            </div>
            <input
              id={`lab-${c.key}`}
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={c.value}
              onChange={(e) => setParam(c.key, Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-earth-border accent-seismic-orange"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-earth-border bg-earth-surface px-4 py-3">
        <p className="text-fluid-00 text-text-secondary">
          Skor jadi{" "}
          <span className="font-mono text-fluid-1 font-bold tabular-nums text-text-primary">
            {total.toLocaleString("id-ID")}
          </span>{" "}
          <span className="text-text-muted">
            ({riskTierLabel(tier as never)})
          </span>
          {touched && delta !== 0 && (
            <span className="ml-2 font-mono tabular-nums text-seismic-bright">
              {delta > 0 ? "+" : ""}
              {delta.toLocaleString("id-ID")} dari {seed.regionName}
            </span>
          )}
        </p>
        {touched && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-tap items-center rounded-lg border border-earth-border px-3 text-fluid-00 text-text-secondary transition-colors hover:border-seismic-orange hover:text-seismic-bright"
          >
            Kembalikan ke angka asli
          </button>
        )}
      </div>

      <ScoreBreakdown components={components} total={total} />

      {touched && (
        <p className="rounded-lg border border-risk-amber/25 bg-risk-amber/[0.06] px-3.5 py-3 text-fluid-00 leading-relaxed text-text-secondary">
          <strong className="font-semibold text-risk-amber">Ingat —</strong> yang
          kamu lihat sekarang adalah wilayah rekaan, bukan {seed.regionName} dan
          bukan wilayah mana pun. Gunanya untuk merasakan bobot tiap komponen,
          bukan untuk menyimpulkan risiko suatu tempat.
        </p>
      )}
    </div>
  );
}

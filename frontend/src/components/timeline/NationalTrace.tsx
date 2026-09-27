"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadQuakes, type QuakeField } from "@/lib/quakes";
import { magnitudeToUnitHeight } from "@/lib/seismogram";

interface Flag {
  id: number;
  label: string;
  date: string; // ISO date
}

const FIRST = 1970;
const BAND_VAR = ["var(--depth-shallow-fill)", "var(--depth-mid-fill)", "var(--depth-deep-fill)"];

/**
 * Indonesia's record in one line: the largest recorded earthquake of each
 * year since 1970 (height = magnitude on the seismogram's curve, colour =
 * depth), with every disaster in the archive flagged on the same axis.
 *
 * It anchors the archive to the signature object, and it shows what a list
 * cannot: most great earthquakes were not disasters, and the disasters were
 * not always the largest events — Yogyakarta 2006 was an M6.4.
 */
export function NationalTrace({ flags }: { flags: Flag[] }) {
  const [field, setField] = useState<QuakeField | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    loadQuakes().then(setField);
  }, []);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const perYear = useMemo(() => {
    const best = new Map<number, { m: number; band: number }>();
    if (!field) return best;
    for (let i = 0; i < field.count; i++) {
      const y = field.year[i];
      if (y < FIRST) continue;
      const cur = best.get(y);
      if (!cur || field.mag[i] > cur.m) best.set(y, { m: field.mag[i], band: field.band[i] });
    }
    return best;
  }, [field]);

  const last = Math.max(FIRST + 1, ...Array.from(perYear.keys()));
  const narrow = width < 640;
  const flagRows = narrow ? 2 : 3;
  const top = 18 + flagRows * 17;
  const H = narrow ? 100 : 130;
  const pl = 30;
  const pr = 8;
  const total = top + H + 24;
  const x = (yearFrac: number) => pl + ((yearFrac - FIRST) / (last + 1 - FIRST)) * (width - pl - pr);
  const base = top + H;
  const y = (m: number) => base - magnitudeToUnitHeight(m) * H;
  const spike = Math.max(2, ((width - pl - pr) / (last + 1 - FIRST)) * 0.5);

  const sortedFlags = [...flags].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <figure className="m-0">
      <div ref={boxRef} className="w-full">
        {width > 0 && field ? (
          <svg width={width} height={total} viewBox={`0 0 ${width} ${total}`} aria-hidden="true" className="block">
            {[6, 7, 8, 9].map((m) => (
              <g key={m}>
                <line x1={pl} x2={width - pr} y1={y(m)} y2={y(m)} stroke="var(--rule)" strokeDasharray="2 4" />
                <text x={0} y={y(m) + 4} fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-3)">
                  M{m}
                </text>
              </g>
            ))}
            {sortedFlags.map((f, i) => {
              const [yy, mm] = f.date.split("-").map(Number);
              const fx = x(yy + (mm - 0.5) / 12);
              const row = i % flagRows;
              const ly = 14 + row * 17;
              const end = fx > width * 0.78;
              return (
                <g key={f.id}>
                  <line x1={fx} x2={fx} y1={ly + 4} y2={base} stroke="var(--ink-3)" strokeDasharray="2 3" />
                  <text
                    x={fx + (end ? -4 : 4)}
                    y={ly}
                    textAnchor={end ? "end" : "start"}
                    fontSize={narrow ? 11 : 12}
                    fontWeight={600}
                    fill="var(--ink)"
                  >
                    {f.label} {yy}
                  </text>
                </g>
              );
            })}
            {Array.from(perYear.entries()).map(([yr, v]) => (
              <line
                key={yr}
                x1={x(yr + 0.5)}
                x2={x(yr + 0.5)}
                y1={base}
                y2={y(v.m)}
                stroke={BAND_VAR[v.band]}
                strokeWidth={spike}
                strokeLinecap="round"
              />
            ))}
            <line x1={pl} x2={width - pr} y1={base} y2={base} stroke="var(--rule-strong)" />
            {Array.from({ length: Math.floor((last - FIRST) / 10) + 1 }, (_, i) => FIRST + i * 10).map((yr) => (
              <text
                key={yr}
                x={x(yr)}
                y={total - 4}
                textAnchor={yr === FIRST ? "start" : "middle"}
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill="var(--ink-3)"
              >
                {yr}
              </text>
            ))}
          </svg>
        ) : (
          <div style={{ height: 210 }} className="animate-pulse rounded-lg bg-sunken" />
        )}
      </div>
      <figcaption className="mt-2 text-fluid-00 leading-relaxed text-ink-2">
        Gempa terbesar tiap tahun di Indonesia sejak {FIRST} (M4.5+, tinggi = magnitudo, warna = kedalaman), dengan
        bencana dalam arsip ini ditandai. Banyak gempa besar tidak menjadi bencana, dan bencana tidak selalu
        berasal dari gempa terbesar.
      </figcaption>
    </figure>
  );
}

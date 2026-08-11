"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFigure } from "./ChartFigure";
import { AXIS, MAGNITUDE_RAMP, TOOLTIP } from "./chartTheme";
import { num } from "@/lib/format";
import type { RegionRiskProfile } from "@/lib/types";

/**
 * Magnitude-frequency distribution (Gutenberg–Richter in shape).
 *
 * Horizontal, with the count printed at the end of each bar. Event counts fall
 * off by roughly an order of magnitude per step — a region with 117 M4+ quakes
 * might have one M7+ — so on a shared linear vertical axis the tiers that
 * matter most collapsed to invisible slivers against the baseline. Direct
 * labels mean every tier states its value whatever its bar does, and the row
 * layout gives the tier names room to be read.
 *
 * Colour is a single-hue sequential ramp: these are four steps of one ordinal
 * variable, not four categories, and the previous green→amber→orange→red
 * scheme borrowed the risk-tier status colours for something that is not a
 * risk tier.
 */
export function MagnitudeFreqChart({ profile }: { profile: RegionRiskProfile }) {
  const data = [
    { tier: "M4+", count: profile.event_count_m4 },
    { tier: "M5+", count: profile.event_count_m5 },
    { tier: "M6+", count: profile.event_count_m6 },
    { tier: "M7+", count: profile.event_count_m7_plus },
  ];

  return (
    <ChartFigure
      caption="Jumlah gempa tercatat per tingkat magnitudo, dalam radius 100 km"
      columns={["Tingkat magnitudo", "Jumlah kejadian"]}
      rows={data.map((d) => [d.tier, num(d.count)])}
      note={
        <div className="mt-2 space-y-2.5">
          {/*
            The app's core vocabulary was never defined anywhere. A reader who
            takes M7 for "a bit worse than M6" misreads this chart, the
            magnitude component of the score, and every badge on the site — so
            the scale is explained where magnitudes are first set against each
            other, not on a methodology page.
          */}
          <p className="text-fluid-00 leading-relaxed text-text-secondary">
            <strong className="font-semibold text-text-primary">
              Tiap satu angka magnitudo adalah lompatan besar.
            </strong>{" "}
            Skala magnitudo bersifat logaritmik: naik 1 angka berarti guncangan
            di seismograf ±10 kali lebih besar, dan energi yang dilepaskan ±32
            kali lebih besar. Jadi M7 bukan &ldquo;sedikit di atas&rdquo; M6 —
            energinya sekitar 32 kali lipat, dan M7 dibanding M5 sekitar 1.000
            kali lipat.
          </p>
          <p className="text-fluid-00 leading-relaxed text-text-secondary">
            Itu juga sebabnya batangnya memendek drastis: gempa besar melepas
            energi jauh lebih banyak, dan kejadian sebesar itu jauh lebih
            jarang. Pola menurun seperti ini berlaku di seluruh dunia, bukan
            khas wilayah ini.
          </p>
          <p className="text-fluid-000 leading-relaxed text-text-muted">
            Jumlah dihitung dalam radius 100 km dari pusat wilayah. Angka
            perbandingan energi di atas adalah pembulatan yang lazim dipakai
            untuk penjelasan, bukan hasil hitungan per kejadian.
          </p>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 44, top: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="tier"
            axisLine={false}
            tickLine={false}
            width={42}
            stroke={AXIS.stroke}
            fontSize={12}
          />
          <Tooltip
            {...TOOLTIP}
            formatter={(v: number) => [`${num(v)} kejadian`, "Tercatat"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={d.tier} fill={MAGNITUDE_RAMP[i]} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(v: number) => num(v)}
              style={{
                fill: "#B8B1A6",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

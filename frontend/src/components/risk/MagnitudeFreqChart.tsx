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
        <p className="mt-1 text-fluid-000 leading-relaxed text-text-muted">
          Gempa besar jauh lebih jarang daripada gempa kecil — pola ini berlaku di
          seluruh dunia. Jumlah dihitung dalam radius 100 km dari pusat wilayah.
        </p>
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

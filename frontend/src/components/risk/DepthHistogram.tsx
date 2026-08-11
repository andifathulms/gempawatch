"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFigure } from "./ChartFigure";
import { AXIS, GRID, TOOLTIP } from "./chartTheme";
import { DEPTH_BANDS, depthColor } from "@/lib/seismic";
import { num } from "@/lib/format";
import type { TimelineEvent } from "@/lib/types";

const BINS = [
  { label: "0–30", min: 0, max: 30 },
  { label: "30–70", min: 30, max: 70 },
  { label: "70–150", min: 70, max: 150 },
  { label: "150–300", min: 150, max: 300 },
  { label: "300+", min: 300, max: Infinity },
];

/**
 * Depth distribution. Shallow quakes do the damage, so the shape of this
 * histogram is a real part of a region's risk picture, not a curiosity.
 *
 * Bars are coloured by the same depth encoding the maps and badges use rather
 * than a single hue. Consistency across the product wins here: a reader who
 * has learnt that red means shallow on the map should not have to relearn it
 * on the chart, and the legend below states the mapping outright.
 */
export function DepthHistogram({ events }: { events: TimelineEvent[] }) {
  const data = BINS.map((b) => ({
    label: b.label,
    count: events.filter((e) => e.depth_km >= b.min && e.depth_km < b.max).length,
    // Colour from the midpoint of the bin, so each bar takes the band it sits in.
    color: depthColor(b.max === Infinity ? 400 : (b.min + b.max) / 2),
  }));

  const legend = (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-fluid-000 text-text-muted">
      {DEPTH_BANDS.map((b) => (
        <span key={b.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: b.color }}
          />
          {b.label} <span className="font-mono">{b.detail}</span>
        </span>
      ))}
    </div>
  );

  return (
    <ChartFigure
      caption="Jumlah gempa tercatat per rentang kedalaman"
      columns={["Rentang kedalaman (km)", "Jumlah kejadian"]}
      rows={data.map((d) => [d.label, num(d.count)])}
      note={legend}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} axisLine={false} />
          <YAxis {...AXIS} axisLine={false} allowDecimals={false} width={44} />
          <Tooltip
            {...TOOLTIP}
            labelFormatter={(l) => `Kedalaman ${l} km`}
            formatter={(v: number) => [`${num(v)} kejadian`, "Tercatat"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

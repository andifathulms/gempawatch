"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { ChartFigure } from "./ChartFigure";
import { AXIS, GRID, TOOLTIP } from "./chartTheme";
import { DEPTH_BANDS, depthColor } from "@/lib/seismic";
import { magnitude, num, shortDate } from "@/lib/format";
import type { TimelineEvent } from "@/lib/types";

/**
 * Every recorded event: magnitude on Y, time on X, depth as colour. Reveals
 * clustering, aftershock sequences, and quiet decades at a glance.
 *
 * Points are semi-transparent and small because dense regions plot thousands of
 * them — at full opacity the cluster becomes a solid block and the shape of the
 * sequence disappears into it.
 */
export function EventScatterTimeline({ events }: { events: TimelineEvent[] }) {
  const data = events.map((e) => ({
    x: new Date(e.event_time).getTime(),
    y: e.magnitude,
    depth: e.depth_km,
  }));

  const legend = (
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-fluid-000 text-text-muted">
          <span>Warna = kedalaman:</span>
          {DEPTH_BANDS.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: b.color }}
              />
              {b.label}
            </span>
          ))}
        </div>
  );

  /*
    A per-event table would run to thousands of rows and tell a screen-reader
    user nothing. What this chart is FOR — per its own subtitle — is where the
    events bunch up and where they go quiet, so the text alternative summarises
    by decade: how many, and how large. Same question the picture answers.
  */
  const byDecade = new Map<number, { count: number; largest: number }>();
  for (const e of events) {
    const decade = Math.floor(new Date(e.event_time).getFullYear() / 10) * 10;
    const prev = byDecade.get(decade);
    if (!prev) byDecade.set(decade, { count: 1, largest: e.magnitude });
    else {
      prev.count++;
      if (e.magnitude > prev.largest) prev.largest = e.magnitude;
    }
  }
  const decadeRows: Array<[string, string]> = [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, v]) => [
      `${decade}-an`,
      `${num(v.count)} kejadian, terbesar ${magnitude(v.largest)}`,
    ]);

  return (
    <ChartFigure
      caption="Sebaran gempa menurut waktu dan magnitudo, diringkas per dekade"
      columns={["Dekade", "Ringkasan"]}
      rows={decadeRows}
      note={legend}
    >
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 4, left: -10 }}>
          <CartesianGrid {...GRID} vertical />
          <XAxis
            type="number"
            dataKey="x"
            domain={["dataMin", "dataMax"]}
            {...AXIS}
            axisLine={false}
            tickFormatter={(t) => new Date(t).getFullYear().toString()}
          />
          <YAxis
            type="number"
            dataKey="y"
            {...AXIS}
            axisLine={false}
            width={44}
            domain={[3, "dataMax"]}
            tickFormatter={(v: number) => `M${v.toFixed(0)}`}
          />
          <ZAxis range={[26, 26]} />
          <Tooltip
            {...TOOLTIP}
            cursor={{ stroke: "#494339", strokeDasharray: "3 3" }}
            formatter={(value: number, name: string) => {
              if (name === "y") return [`M${value.toFixed(1)}`, "Magnitudo"];
              if (name === "depth") return [`${value.toFixed(0)} km`, "Kedalaman"];
              return [value, name];
            }}
            labelFormatter={(t) => shortDate(new Date(t as number).toISOString())}
          />
          <Scatter
            data={data}
            isAnimationActive={false}
            shape={(props: { cx?: number; cy?: number; payload?: { depth: number } }) => (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={3.5}
                fill={depthColor(props.payload?.depth ?? 0)}
                fillOpacity={0.6}
              />
            )}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

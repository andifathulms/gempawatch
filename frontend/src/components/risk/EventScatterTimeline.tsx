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
import { depthColor } from "@/lib/seismic";
import type { TimelineEvent } from "@/lib/types";

// Scatter of all historical events: magnitude (Y) vs time (X). Reveals
// clustering and quiet periods visually.
export function EventScatterTimeline({ events }: { events: TimelineEvent[] }) {
  const data = events.map((e) => ({
    x: new Date(e.event_time).getTime(),
    y: e.magnitude,
    depth: e.depth_km,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="#3A3A3A" strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          domain={["dataMin", "dataMax"]}
          stroke="#A8A39A"
          fontSize={11}
          tickFormatter={(t) => new Date(t).getFullYear().toString()}
        />
        <YAxis
          type="number"
          dataKey="y"
          stroke="#A8A39A"
          fontSize={12}
          domain={[3, "dataMax"]}
          label={{ value: "Magnitudo", angle: -90, position: "insideLeft", fill: "#A8A39A", fontSize: 12 }}
        />
        <ZAxis range={[30, 30]} />
        <Tooltip
          contentStyle={{
            background: "#2D2D2D",
            border: "1px solid #3A3A3A",
            borderRadius: 8,
            color: "#F2EDE4",
          }}
          formatter={(value: number, name: string) =>
            name === "y" ? [`M${value.toFixed(1)}`, "Magnitudo"] : [value, name]
          }
          labelFormatter={(t) => new Date(t as number).toLocaleDateString("id-ID")}
        />
        <Scatter
          data={data}
          shape={(props: { cx?: number; cy?: number; payload?: { depth: number } }) => (
            <circle
              cx={props.cx}
              cy={props.cy}
              r={4}
              fill={depthColor(props.payload?.depth ?? 0)}
              fillOpacity={0.7}
            />
          )}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

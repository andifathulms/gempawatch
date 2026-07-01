"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelineEvent } from "@/lib/types";

const BINS = [
  { label: "0–30", min: 0, max: 30 },
  { label: "30–70", min: 30, max: 70 },
  { label: "70–150", min: 70, max: 150 },
  { label: "150–300", min: 150, max: 300 },
  { label: "300+", min: 300, max: Infinity },
];

// Depth distribution — shallow quakes are more damaging, so this matters.
export function DepthHistogram({ events }: { events: TimelineEvent[] }) {
  const data = BINS.map((b) => ({
    label: b.label,
    count: events.filter((e) => e.depth_km >= b.min && e.depth_km < b.max).length,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="label" stroke="#A8A39A" fontSize={11} />
        <YAxis stroke="#A8A39A" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "#2D2D2D",
            border: "1px solid #3A3A3A",
            borderRadius: 8,
            color: "#F2EDE4",
          }}
          cursor={{ fill: "#ffffff08" }}
          labelFormatter={(l) => `Kedalaman ${l} km`}
        />
        <Bar dataKey="count" fill="#4A7C9E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RegionRiskProfile } from "@/lib/types";

// Gutenberg-Richter style magnitude-frequency bars for a region.
export function MagnitudeFreqChart({ profile }: { profile: RegionRiskProfile }) {
  const data = [
    { tier: "M4+", count: profile.event_count_m4, color: "#5B8C5A" },
    { tier: "M5+", count: profile.event_count_m5, color: "#D4A12B" },
    { tier: "M6+", count: profile.event_count_m6, color: "#E8743B" },
    { tier: "M7+", count: profile.event_count_m7_plus, color: "#C0392B" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="tier" stroke="#A8A39A" fontSize={12} />
        <YAxis stroke="#A8A39A" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "#2D2D2D",
            border: "1px solid #3A3A3A",
            borderRadius: 8,
            color: "#F2EDE4",
          }}
          cursor={{ fill: "#ffffff08" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.tier} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

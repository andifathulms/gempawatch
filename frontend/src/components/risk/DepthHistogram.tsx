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
import { DEPTH_BINS, DEPTH_BANDS, depthColor, type DepthBin } from "@/lib/seismic";
import { num } from "@/lib/format";


/**
 * Depth distribution. Shallow quakes do the damage, so the shape of this
 * histogram is a real part of a region's risk picture, not a curiosity.
 *
 * Bars are coloured by the same depth encoding the maps and badges use rather
 * than a single hue. Consistency across the product wins here: a reader who
 * has learnt that red means shallow on the map should not have to relearn it
 * on the chart, and the legend below states the mapping outright.
 */
export function DepthHistogram({ bins }: { bins: DepthBin[] }) {
  const data = bins.map((bin, i) => ({
    ...bin,
    // Colour from the midpoint of the bin, so each bar takes the band it sits in.
    color: depthColor(
      DEPTH_BINS[i].max === Infinity
        ? 400
        : (DEPTH_BINS[i].min + DEPTH_BINS[i].max) / 2,
    ),
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
      note={
        <div className="mt-2 space-y-2.5">
          {legend}
          <p className="text-fluid-00 leading-relaxed text-text-secondary">
            <strong className="font-semibold text-text-primary">
              Kenapa kedalaman dihitung terpisah dari kekuatan.
            </strong>{" "}
            Gempa M6 pada kedalaman 10 km dan M6 pada kedalaman 200 km punya
            magnitudo sama, tetapi yang dangkal melepaskan energinya jauh lebih
            dekat ke permukaan, sehingga guncangan yang sampai ke bangunan jauh
            lebih keras dan wilayah rusaknya lebih sempit tapi lebih parah.
            Gempa dalam menyebar energinya lewat jarak yang lebih panjang, jadi
            terasa lebih luas tetapi lebih lemah.
          </p>
          <p className="text-fluid-00 leading-relaxed text-text-secondary">
            Yogyakarta 2006 adalah contohnya: M6,3 — tidak termasuk gempa
            terbesar di arsip ini — tetapi kedalamannya hanya sekitar 12 km, dan
            menjadi salah satu bencana paling mematikan dalam catatan modern
            Indonesia. Itulah sebabnya batang di sebelah kiri grafik ini lebih
            penting daripada tingginya saja.
          </p>
          <p className="text-fluid-000 leading-relaxed text-text-muted">
            Batas 70 km yang dipakai skor adalah garis yang kami tetapkan untuk
            memisahkan &ldquo;dangkal&rdquo; dari &ldquo;dalam&rdquo;. Alam
            tidak punya batas setegas itu — kedalaman 69 km dan 71 km hampir
            sama saja.
          </p>
        </div>
      }
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

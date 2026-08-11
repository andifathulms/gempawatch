import {
  FAULT_PROXIMITY_RANGE_KM,
  FREQUENCY_SATURATION_PER_YEAR,
} from "@/lib/engine/scoring";
import { magnitude } from "@/lib/format";
import type { ScoreComponent } from "@/lib/types";

interface Props {
  components: ScoreComponent[];
  total: number;
}

/**
 * The composite score, itemised.
 *
 * The product's whole claim is that its number is traceable to a rule, and
 * until now the rule was only described in prose while the number arrived
 * whole. Showing the four terms is what makes the claim checkable: a reader can
 * see that two places sharing a score got there differently, and — more
 * usefully — that an active area has pinned the frequency term at its ceiling,
 * so everything separating it from its neighbours lives in the other three.
 *
 * Each row states its own input ("0,8 gempa/tahun"), because a bar that cannot
 * be checked against the documented rule is decoration.
 */

const LABELS: Record<
  ScoreComponent["key"],
  { title: string; rule: string; basis: (b: Record<string, number | null>) => string | null }
> = {
  frequency: {
    title: "Frekuensi",
    rule: `Gempa M4+ per tahun dalam radius 100 km, penuh pada ${FREQUENCY_SATURATION_PER_YEAR.toLocaleString("id-ID")}/tahun.`,
    basis: (b) =>
      b.events_per_year === null
        ? null
        : `${b.events_per_year!.toLocaleString("id-ID")} gempa M4+ per tahun`,
  },
  magnitude: {
    title: "Magnitudo terbesar",
    rule:
      "Magnitudo terbesar yang pernah tercatat, M4 → 0 poin, M9 → poin penuh. " +
      "Pemetaannya lurus meski skala magnitudo logaritmik — penyederhanaan yang " +
      "kami pilih supaya aturannya bisa diperiksa, dan yang membuat selisih di " +
      "ujung atas skala tampak lebih kecil daripada selisih energinya.",
    basis: (b) =>
      b.largest_magnitude === null
        ? null
        : `${magnitude(b.largest_magnitude)} tercatat`,
  },
  shallow: {
    title: "Proporsi gempa dangkal",
    rule: "Bagian kejadian dengan kedalaman di bawah 70 km, yang umumnya paling merusak.",
    basis: (b) =>
      b.shallow_ratio === null
        ? null
        : `${Math.round(b.shallow_ratio! * 100)}% kejadian lebih dangkal dari 70 km`,
  },
  proximity: {
    title: "Kedekatan sesar",
    rule: `Jarak ke sesar aktif terdekat, penuh di bawah ~10 km, nol pada ${FAULT_PROXIMITY_RANGE_KM.toLocaleString("id-ID")} km.`,
    basis: (b) =>
      b.nearest_fault_distance_km === null
        ? null
        : `${b.nearest_fault_distance_km!.toLocaleString("id-ID")} km ke sesar terdekat`,
  },
};

export function ScoreBreakdown({ components, total }: Props) {
  return (
    <div className="space-y-4">
      <ul className="space-y-3.5">
        {components.map((c) => {
          const meta = LABELS[c.key];
          const basis = meta.basis(c.basis);
          const pct = c.max_points ? (c.points / c.max_points) * 100 : 0;
          return (
            <li key={c.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-fluid-00 font-medium text-text-primary">
                  {meta.title}
                </span>
                <span className="shrink-0 font-mono text-fluid-00 tabular-nums text-text-secondary">
                  <span className="font-bold text-text-primary">
                    {c.points.toLocaleString("id-ID")}
                  </span>
                  <span className="text-text-muted"> / {c.max_points}</span>
                </span>
              </div>

              {/* The points are printed beside this bar, so labelling it
                  would say the same thing twice. */}
              <div
                aria-hidden="true"
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-earth-dark"
              >
                <div
                  className="h-full origin-left rounded-full bg-seismic-orange motion-safe:animate-draw-in"
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                />
              </div>

              <p className="mt-1.5 text-fluid-00 leading-relaxed text-text-secondary">
                {basis ? (
                  <span className="font-medium text-text-primary">{basis}</span>
                ) : null}
                {basis ? " · " : null}
                {meta.rule}
                {/* The ceiling is the most load-bearing thing this panel can
                    say: past it, this term stops telling two places apart. */}
                {c.saturated && (
                  <span className="text-risk-amber"> Komponen ini sudah mentok.</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-earth-border pt-3 text-fluid-00 leading-relaxed text-text-muted">
        Skor total{" "}
        <span className="font-mono font-bold tabular-nums text-text-primary">
          {total.toLocaleString("id-ID")}
        </span>{" "}
        dari 100. Tiap komponen dibulatkan satu desimal sendiri-sendiri, jadi
        penjumlahannya bisa meleset 0,1–0,2 dari skor total — skor total yang
        jadi acuan.
      </p>

      {/*
        Where the rule comes from, said where the rule is applied.

        A 0–100 figure with fixed tier thresholds, sitting beside BMKG and USGS
        credits, reads as an official index. It is not one: the inputs are
        theirs, the weighting is ours. A reader who mistakes what KIND of number
        this is has misunderstood the app at the root, and every other
        explanation on the site is downstream of that mistake — so this belongs
        next to the arithmetic, not in a methodology footnote.
      */}
      <p className="rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3 text-fluid-00 leading-relaxed text-text-secondary">
        <strong className="font-semibold text-text-primary">
          Skor ini buatan GempaWatch.
        </strong>{" "}
        Datanya resmi — kejadian gempa dari{" "}
        <a
          href="https://www.bmkg.go.id/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-seismic-bright"
        >
          BMKG
        </a>{" "}
        dan{" "}
        <a
          href="https://earthquake.usgs.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-seismic-bright"
        >
          USGS
        </a>{" "}
        — tetapi{" "}
        <strong className="font-semibold text-text-primary">
          pembagian bobotnya kami yang menentukan
        </strong>
        : angka 40/30/15/15 di atas adalah pilihan editorial kami, bukan ukuran
        baku seismologi dan bukan indeks resmi lembaga mana pun. Orang lain bisa
        membobot hal yang sama dengan cara berbeda dan sampai pada angka
        berbeda. Yang kami janjikan bukan bahwa angka ini benar secara mutlak,
        melainkan bahwa aturannya terbuka dan bisa kamu periksa sendiri.
      </p>
    </div>
  );
}

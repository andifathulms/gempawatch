import { magnitude } from "@/lib/format";
import type { LargestEventSensitivity as Sensitivity } from "@/lib/types";

interface Props {
  sensitivity: Sensitivity;
  score: number;
}

/**
 * How much of the score rests on one earthquake.
 *
 * The magnitude term is an extremum rather than an average and never decays, so
 * a single event can carry up to 30 of the 100 points decades after the fact.
 * Two places on the same score can therefore mean "this keeps happening" or
 * "this happened once, badly" — and the composite says neither.
 *
 * The framing here is load-bearing and deliberately one-directional: this is a
 * decomposition of a historical number, NOT a smaller "true" risk. A past M7.6
 * is evidence about a place, not an outlier to discount, and the copy never
 * offers the lower figure as the real one. It answers "how much of this number
 * is one day?" and stops there.
 */
export function LargestEventSensitivity({ sensitivity, score }: Props) {
  const { removed, score_without, score_delta, next_largest_magnitude } =
    sensitivity;
  const share = score > 0 ? Math.round((score_delta / score) * 100) : 0;

  return (
    <div className="space-y-3.5">
      <p className="text-fluid-00 leading-relaxed text-text-secondary">
        Kejadian terbesar dalam radius 100 km adalah{" "}
        <span className="font-semibold text-text-primary">
          {magnitude(removed.magnitude)}
        </span>
        {removed.year ? (
          <>
            {" "}
            pada tahun{" "}
            <span className="font-mono font-semibold tabular-nums text-text-primary">
              {removed.year}
            </span>
          </>
        ) : null}
        . Kalau satu kejadian itu tidak ada dalam catatan, skor lokasi ini
        menjadi{" "}
        <span className="font-mono font-semibold tabular-nums text-text-primary">
          {score_without.toLocaleString("id-ID")}
        </span>{" "}
        — selisih{" "}
        <span className="font-mono font-semibold tabular-nums text-seismic-bright">
          {score_delta.toLocaleString("id-ID")}
        </span>{" "}
        poin
        {share > 0 ? `, sekitar ${share}% dari skor` : ""}.
      </p>

      <div className="flex items-stretch gap-3">
        <div className="flex-1 rounded-lg border border-earth-border bg-earth-dark/40 px-3.5 py-3">
          <p className="font-mono text-fluid-2 font-bold tabular-nums text-text-primary">
            {score.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-fluid-00 leading-snug text-text-secondary">
            Skor sebenarnya, dengan seluruh catatan
          </p>
        </div>
        <div className="flex-1 rounded-lg border border-dashed border-earth-border-strong px-3.5 py-3">
          <p className="font-mono text-fluid-2 font-bold tabular-nums text-text-muted">
            {score_without.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-fluid-00 leading-snug text-text-muted">
            Andai kejadian terbesar itu tidak pernah tercatat
            {next_largest_magnitude !== null ? (
              <>
                {" "}
                (terbesar berikutnya {magnitude(next_largest_magnitude)})
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* The one reading this panel must not invite. */}
      <p className="rounded-lg border border-risk-amber/25 bg-risk-amber/[0.06] px-3.5 py-3 text-fluid-00 leading-relaxed text-text-secondary">
        <strong className="font-semibold text-risk-amber">Bukan berarti</strong>{" "}
        angka yang lebih rendah itu yang benar. Kejadian besar yang sudah pernah
        terjadi adalah bukti tentang wilayah ini, bukan pengecualian yang bisa
        dicoret. Perbandingan ini hanya menunjukkan seberapa besar bagian skor
        yang bertumpu pada satu kejadian, bukan pola yang berulang.
      </p>
    </div>
  );
}

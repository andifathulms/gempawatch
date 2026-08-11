import { num } from "@/lib/format";

interface Props {
  earliestYear: number | null;
  latestYear: number | null;
  years: number;
  /** M4+ events inside the scoring radius — the numerator of the rate. */
  m4Count?: number;
  /** Where the window came from: a point query or a stored region profile. */
  scope?: "point" | "region";
}

/**
 * What the history behind this number actually covers.
 *
 * The frequency term is events-per-year, and the denominator is not a fixed
 * 1970–present window: it is derived from the events actually found near the
 * query, as latest_year − earliest_year + 1. A place with four events between
 * 2018 and 2022 therefore gets a five-year window and a rate of 0.8/yr, which
 * reads far busier than "four events since 1970" would.
 *
 * That asymmetry is a property of the rule, not a bug, but it was completely
 * invisible — the report showed a rate without ever showing its denominator, so
 * quiet places could look more active than they are. Naming the window, and
 * saying plainly that it varies by location, is what makes the rate checkable.
 */
export function CoverageNote({
  earliestYear,
  latestYear,
  years,
  m4Count,
  scope = "point",
}: Props) {
  const hasWindow = Boolean(earliestYear && latestYear && years > 0);
  const area = scope === "point" ? "titik ini" : "wilayah ini";

  return (
    <div className="space-y-3 text-fluid-00 leading-relaxed text-text-secondary">
      {hasWindow ? (
        <p>
          Catatan gempa di sekitar {area} membentang{" "}
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {earliestYear}–{latestYear}
          </span>
          , yaitu{" "}
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {num(years)}
          </span>{" "}
          tahun
          {m4Count !== undefined && (
            <>
              {" "}
              berisi{" "}
              <span className="font-mono font-semibold tabular-nums text-text-primary">
                {num(m4Count)}
              </span>{" "}
              gempa M4+
            </>
          )}
          . Rentang inilah yang jadi pembagi saat menghitung komponen frekuensi.
        </p>
      ) : (
        <p>
          Tidak ada kejadian tercatat di sekitar {area} dalam basis data ini,
          jadi komponen frekuensi bernilai nol — bukan berarti wilayah ini pasti
          aman.
        </p>
      )}

      <ul className="space-y-2.5">
        <li className="flex gap-2.5">
          <span aria-hidden="true" className="shrink-0 text-text-secondary">
            ·
          </span>
          <span>
            <strong className="font-semibold text-text-secondary">
              Rentangnya berbeda tiap lokasi.
            </strong>{" "}
            Rentang dihitung dari kejadian yang ditemukan di dekat lokasi, bukan
            dari jendela tetap. Wilayah yang sepi bisa punya rentang pendek,
            sehingga rata-rata per tahunnya terlihat lebih tinggi daripada kalau
            dibagi seluruh periode arsip.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span aria-hidden="true" className="shrink-0 text-text-secondary">
            ·
          </span>
          <span>
            <strong className="font-semibold text-text-secondary">
              Ada batas magnitudo.
            </strong>{" "}
            Arsip historis USGS disaring pada M4,0 ke atas, jadi gempa yang lebih
            kecil umumnya tidak terhitung. Kejadian langsung dari BMKG bisa lebih
            kecil dari itu.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span aria-hidden="true" className="shrink-0 text-text-secondary">
            ·
          </span>
          <span>
            <strong className="font-semibold text-text-secondary">
              Dekade awal lebih tipis.
            </strong>{" "}
            Jaringan seismik dulu lebih jarang, sehingga kejadian lama lebih
            mungkin luput dari catatan dibanding kejadian belakangan.
          </span>
        </li>
      </ul>
    </div>
  );
}

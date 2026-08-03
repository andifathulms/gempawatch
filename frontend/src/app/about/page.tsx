import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { num } from "@/lib/format";
import { api } from "@/lib/api";

export const metadata = {
  title: "Tentang & Metodologi — GempaWatch",
  description:
    "Sumber data, metodologi risiko, dan atribusi BMKG & USGS untuk GempaWatch.",
};

export const revalidate = 3600;

/** Anchors for the contents rail — a methodology page people cite in parts. */
const SECTIONS = [
  { id: "bukan-peringatan", label: "Bukan sistem peringatan dini" },
  { id: "sumber-data", label: "Sumber data" },
  { id: "skor", label: "Cara skor dihitung" },
  { id: "tsunami", label: "Tingkat risiko tsunami" },
  { id: "keterbatasan", label: "Keterbatasan yang kami akui" },
  { id: "atribusi", label: "Atribusi" },
];

const WEIGHTS = [
  {
    label: "Frekuensi gempa M4+ per tahun",
    max: 40,
    note: "Seberapa sering wilayah ini berguncang.",
  },
  {
    label: "Magnitudo terbesar tercatat",
    max: 30,
    note: "Sekuat apa kejadian terburuk yang pernah tercatat.",
  },
  {
    label: "Proporsi gempa dangkal (<70 km)",
    max: 15,
    note: "Gempa dangkal lebih terasa dan lebih merusak di permukaan.",
  },
  {
    label: "Kedekatan sesar aktif",
    max: 15,
    note: "Dekat sesar berarti guncangan cenderung lebih kuat.",
  },
];

export default async function AboutPage() {
  let coverage: { earliest: number | null; latest: number | null; count: number } = {
    earliest: null,
    latest: null,
    count: 0,
  };
  try {
    const m = await api.meta();
    coverage = {
      earliest: m.earliest_year,
      latest: m.latest_year,
      count: m.event_count,
    };
  } catch {
    /* meta optional */
  }
  const span =
    coverage.earliest && coverage.latest
      ? `${coverage.earliest}–${coverage.latest}`
      : "historis";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tentang & metodologi"
        title="Bagaimana GempaWatch menghitung risiko"
        subtitle="GempaWatch membantu masyarakat memahami risiko gempa di lokasi mereka sendiri — bukan sekadar menampilkan daftar gempa terbaru. Halaman ini menjelaskan datanya dari mana, angkanya dihitung bagaimana, dan apa saja yang tidak bisa disimpulkan darinya."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Kejadian dalam basis data"
          value={num(coverage.count)}
          tone="accent"
        />
        <StatTile label="Rentang catatan" value={span} />
        <StatTile label="Sumber data" value="BMKG + USGS" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Contents rail — this page gets linked to in parts. */}
        <nav
          aria-label="Daftar isi"
          className="hidden lg:sticky lg:top-20 lg:block lg:self-start"
        >
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Isi halaman
          </p>
          <ul className="mt-3 space-y-1.5 border-l border-earth-border">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-text-secondary transition-colors hover:border-seismic-orange hover:text-text-primary"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5">
          <Card id="bukan-peringatan" title="Bukan sistem peringatan dini">
            <div className="rounded-lg border border-risk-amber/25 bg-risk-amber/[0.06] p-4">
              <p className="text-sm leading-relaxed text-text-secondary">
                GempaWatch menampilkan{" "}
                <strong className="font-semibold text-text-primary">
                  pola historis dan konteks risiko
                </strong>
                , bukan prediksi. Kami tidak pernah, dan tidak akan, menyatakan
                bahwa gempa akan terjadi — ilmu kegempaan saat ini tidak
                memungkinkan itu. Untuk peringatan dini tsunami resmi, selalu rujuk
                sistem resmi{" "}
                <a
                  href="https://www.bmkg.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-seismic-bright underline underline-offset-2"
                >
                  BMKG
                </a>
                . Kami melengkapi, bukan menggantikan, mandat resmi tersebut.
              </p>
            </div>
          </Card>

          <Card id="sumber-data" title="Sumber data">
            <dl className="space-y-4 text-sm leading-relaxed text-text-secondary">
              <div>
                <dt className="font-semibold text-text-primary">
                  BMKG — Badan Meteorologi, Klimatologi, dan Geofisika
                </dt>
                <dd className="mt-1">
                  Sumber resmi Indonesia untuk gempa langsung, diperbarui setiap
                  ±5 menit. BMKG hanya memaparkan 15 kejadian terakhir per feed,
                  sehingga kami mengakumulasi riwayatnya sendiri dari waktu ke
                  waktu. Atribusi BMKG bersifat wajib pada setiap halaman yang
                  menampilkan datanya.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">
                  USGS — United States Geological Survey
                </dt>
                <dd className="mt-1">
                  Arsip historis global (1970–kini) yang dibatasi pada kotak
                  koordinat Indonesia, M4.0 ke atas. Ini yang mengisi kekosongan
                  historis yang tidak bisa disediakan BMKG.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">
                  Ketika keduanya melaporkan gempa yang sama
                </dt>
                <dd className="mt-1">
                  Kejadian yang tercatat dalam selisih 5 menit dan 50 km dianggap
                  satu kejadian, dan catatan{" "}
                  <strong className="text-text-primary">BMKG diprioritaskan</strong>{" "}
                  karena lebih akurat secara lokal. Bacaan yang lebih baru dari 1
                  jam ditandai <em>awal</em>, karena BMKG masih dapat merevisi
                  magnitudo dan kedalamannya.
                </dd>
              </div>
            </dl>
          </Card>

          <Card
            id="skor"
            title="Cara skor dihitung"
            subtitle="Satu angka 0–100, dari empat komponen berbobot tetap, dalam radius 100 km dari titik pusat wilayah."
          >
            <ul className="space-y-3">
              {WEIGHTS.map((w) => (
                <li key={w.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-text-primary">
                      {w.label}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-text-muted">
                      maks {w.max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-earth-border">
                    <div
                      className="h-full origin-left animate-draw-in rounded-full bg-seismic-orange/80"
                      style={{ width: `${w.max}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{w.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-earth-border pt-3.5 text-sm leading-relaxed text-text-secondary">
              <strong className="font-semibold text-text-primary">Persentil</strong>{" "}
              memeringkat skor itu terhadap seluruh wilayah lain di basis data,
              sehingga memberi konteks relatif — &ldquo;lebih aktif dari X%
              wilayah&rdquo;. Untuk cek risiko satu titik, radiusnya 50 km, bukan
              100 km.
            </p>
          </Card>

          <Card id="tsunami" title="Tingkat risiko tsunami">
            <p className="text-sm leading-relaxed text-text-secondary">
              Indikator pola historis, bukan peringatan resmi. Kriterianya: wilayah
              pesisir dengan gempa dangkal (&lt;70 km) bermagnitudo ≥6.5 dalam radius
              150 km.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-baseline gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-red-fill" />
                <span className="text-text-secondary">
                  <strong className="text-risk-red">Tinggi</strong> — 3 kejadian atau
                  lebih memenuhi kriteria.
                </span>
              </li>
              <li className="flex items-baseline gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-amber-fill" />
                <span className="text-text-secondary">
                  <strong className="text-risk-amber">Sedang</strong> — 1 sampai 2
                  kejadian.
                </span>
              </li>
              <li className="flex items-baseline gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-green-fill" />
                <span className="text-text-secondary">
                  <strong className="text-risk-green">Rendah</strong> — pesisir, tanpa
                  kejadian yang memenuhi kriteria.
                </span>
              </li>
            </ul>
          </Card>

          <Card id="keterbatasan" title="Keterbatasan yang kami akui">
            <ul className="space-y-3 text-sm leading-relaxed text-text-secondary">
              <li>
                <strong className="text-text-primary">
                  Tidak dinormalisasi terhadap luas atau populasi.
                </strong>{" "}
                Jumlah kejadian dihitung dalam radius tetap, sehingga dua wilayah
                dengan skor sama belum tentu sebanding paparannya. Gunakan persentil
                untuk perbandingan relatif.
              </li>
              <li>
                <strong className="text-text-primary">
                  Status &ldquo;pesisir&rdquo; adalah penyederhanaan.
                </strong>{" "}
                Kami memakainya sebagai pendekatan untuk episentrum lepas pantai,
                bukan penentuan geospasial garis pantai yang presisi.
              </li>
              <li>
                <strong className="text-text-primary">
                  Catatan historis tidak merata.
                </strong>{" "}
                Kepadatan instrumen seismik meningkat pesat sejak 1970-an, sehingga
                kejadian lama lebih jarang tercatat daripada kejadian baru — bukan
                berarti dulu lebih tenang.
              </li>
              <li>
                <strong className="text-text-primary">
                  Riwayat bukan jaminan masa depan.
                </strong>{" "}
                Wilayah berskor rendah tetap bisa mengalami gempa besar. Skor rendah
                berarti &ldquo;jarang tercatat&rdquo;, bukan &ldquo;aman&rdquo;.
              </li>
            </ul>
          </Card>

          <Card id="atribusi" title="Atribusi">
            <SourceAttribution />
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href="/risk-check" size="sm">
                Cek risiko lokasiku →
              </ButtonLink>
              <ButtonLink href="/explore" variant="secondary" size="sm">
                Lihat peringkat wilayah
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

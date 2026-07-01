import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import { api } from "@/lib/api";

export const metadata = {
  title: "Tentang & Metodologi — GempaWatch",
  description:
    "Sumber data, metodologi risiko, dan atribusi BMKG & USGS untuk GempaWatch.",
};

export const revalidate = 3600;

export default async function AboutPage() {
  let coverage: { earliest: number | null; latest: number | null; count: number } = {
    earliest: null,
    latest: null,
    count: 0,
  };
  try {
    const m = await api.meta();
    coverage = { earliest: m.earliest_year, latest: m.latest_year, count: m.event_count };
  } catch {
    /* meta optional */
  }
  const span =
    coverage.earliest && coverage.latest
      ? `${coverage.earliest}–${coverage.latest}`
      : "historis";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Tentang GempaWatch"
        subtitle={
          <>
            GempaWatch membantu masyarakat memahami risiko gempa di lokasi mereka
            sendiri — bukan sekadar menampilkan daftar gempa terbaru. Kami
            menggabungkan data langsung BMKG dengan catatan seismik USGS untuk
            menghitung profil risiko regional. Basis data saat ini memuat{" "}
            <strong className="text-text-primary">
              {coverage.count.toLocaleString("id-ID")} kejadian
            </strong>{" "}
            untuk periode <strong className="text-text-primary">{span}</strong>.
          </>
        }
      />

      <Card title="⚠️ Bukan Sistem Peringatan Dini">
        <p className="text-sm leading-relaxed text-text-secondary">
          GempaWatch menampilkan <strong>pola historis dan konteks risiko</strong>,
          bukan prediksi. Kami tidak pernah menyatakan bahwa gempa akan terjadi.
          Untuk peringatan dini tsunami resmi, selalu rujuk sistem resmi{" "}
          <a
            href="https://www.bmkg.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-seismic-orange underline"
          >
            BMKG
          </a>
          . Kami melengkapi, bukan menggantikan, mandat resmi tersebut.
        </p>
      </Card>

      <Card title="Sumber Data">
        <ul className="space-y-3 text-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">BMKG</strong> — Badan Meteorologi,
            Klimatologi, dan Geofisika. Sumber resmi Indonesia untuk gempa langsung,
            diperbarui setiap ±5 menit. Atribusi BMKG bersifat wajib pada setiap
            halaman yang menampilkan datanya.
          </li>
          <li>
            <strong className="text-text-primary">USGS</strong> — United States
            Geological Survey. Arsip historis global (1970–kini) untuk wilayah
            Indonesia, digunakan mengisi kekosongan data historis BMKG.
          </li>
        </ul>
      </Card>

      <Card title="Metodologi Risiko">
        <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
          <p>
            <strong className="text-text-primary">Skor aktivitas (0–100)</strong>{" "}
            adalah satu angka terkalibrasi yang menimbang empat komponen dengan
            bobot transparan: frekuensi gempa M4+ per tahun (maks 40), magnitudo
            terbesar (maks 30), proporsi gempa dangkal &lt;70km (maks 15), dan
            kedekatan sesar (maks 15) — semuanya dalam radius 100km.{" "}
            <strong className="text-text-primary">Persentil</strong> memperingkat
            skor ini terhadap seluruh wilayah lain, memberi konteks relatif
            (&quot;lebih aktif dari X% wilayah&quot;).
          </p>
          <p>
            <strong className="text-text-primary">Catatan keterbatasan:</strong>{" "}
            jumlah kejadian dihitung dalam radius tetap (100km untuk profil, 50km
            untuk cek risiko) dan <em>tidak</em> dinormalisasi terhadap luas
            wilayah maupun populasi — dua wilayah dengan skor sama belum tentu
            sebanding secara paparan. Gunakan persentil untuk perbandingan relatif.
          </p>
          <p>
            <strong className="text-text-primary">Tingkat risiko tsunami</strong>{" "}
            adalah indikator pola historis, bukan peringatan resmi. Kriteria:
            wilayah pesisir dengan gempa dangkal (&lt;70km), magnitudo ≥6.5, dalam
            radius 150km. TINGGI: 3+ kejadian; SEDANG: 1–2; RENDAH: pesisir tanpa
            kejadian memenuhi kriteria. Status &quot;pesisir&quot; dipakai sebagai
            pendekatan untuk episentrum lepas pantai — sebuah penyederhanaan, bukan
            penentuan geospasial garis pantai yang presisi.
          </p>
          <p>
            <strong className="text-text-primary">Deduplikasi</strong> — ketika BMKG
            dan USGS melaporkan gempa yang sama (dalam 5 menit & 50km), catatan BMKG
            diprioritaskan karena lebih akurat secara lokal.
          </p>
          <p>
            Bacaan awal (&lt;1 jam) ditandai <em>preliminary</em> karena BMKG dapat
            merevisi magnitudo.
          </p>
        </div>
      </Card>

      <Card title="Atribusi">
        <SourceAttribution />
      </Card>
    </div>
  );
}

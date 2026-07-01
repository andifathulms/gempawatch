import { Card } from "@/components/ui/Card";
import { SourceAttribution } from "@/components/ui/SourceAttribution";

export const metadata = {
  title: "Tentang & Metodologi — GempaWatch",
  description:
    "Sumber data, metodologi risiko, dan atribusi BMKG & USGS untuk GempaWatch.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Tentang GempaWatch
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          GempaWatch membantu masyarakat memahami risiko gempa di lokasi mereka
          sendiri — bukan sekadar menampilkan daftar gempa terbaru. Kami
          menggabungkan data langsung BMKG dengan lebih dari 50 tahun catatan
          seismik USGS untuk menghitung profil risiko regional.
        </p>
      </div>

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
            <strong className="text-text-primary">Profil risiko regional</strong>{" "}
            menghitung jumlah gempa M4+, M5+, M6+, dan M7+ dalam radius 100km dari
            pusat wilayah sepanjang catatan sejarah, magnitudo terbesar, kedalaman
            rata-rata, dan sesar terdekat.
          </p>
          <p>
            <strong className="text-text-primary">Tingkat risiko tsunami</strong>{" "}
            adalah indikator pola historis, bukan peringatan resmi. Kriteria:
            wilayah pesisir dengan gempa dangkal (&lt;70km), magnitudo ≥6.5, dalam
            radius 150km. TINGGI: 3+ kejadian; SEDANG: 1–2; RENDAH: pesisir tanpa
            kejadian memenuhi kriteria.
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

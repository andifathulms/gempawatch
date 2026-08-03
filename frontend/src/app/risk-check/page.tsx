import { RiskCheckTool } from "@/components/risk/RiskCheckTool";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Cek Risiko Gempa Saya — GempaWatch",
  description:
    "Apakah lokasi saya berada di zona rawan gempa? Cek jarak ke sesar, jumlah gempa historis, dan tingkat risiko tsunami.",
};

export default function RiskCheckPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cek risiko"
        title="Apakah saya di zona risiko?"
        subtitle={
          <>
            Pilih satu titik dan dapatkan laporan instan: jarak ke sesar aktif
            terdekat, jumlah gempa M4+ dalam radius 50 km sepanjang catatan
            sejarah, dan tingkat risiko tsunami historis bila titik itu berada di
            pesisir. Semuanya adalah{" "}
            <strong className="font-semibold text-text-primary">
              indikator pola historis
            </strong>{" "}
            — bukan prediksi, dan bukan peringatan dini.
          </>
        }
      />
      <RiskCheckTool />
    </div>
  );
}

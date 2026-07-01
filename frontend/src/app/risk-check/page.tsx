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
        title="Apakah Saya di Zona Risiko?"
        subtitle="Pilih lokasi untuk laporan risiko instan — jarak ke sesar terdekat, jumlah gempa M4+ dalam radius 50km sepanjang catatan sejarah, dan tingkat risiko tsunami jika berada di pesisir. Ini adalah indikator pola historis, bukan prediksi atau peringatan dini."
      />
      <RiskCheckTool />
    </div>
  );
}

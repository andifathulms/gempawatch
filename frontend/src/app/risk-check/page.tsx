import { RiskCheckTool } from "@/components/risk/RiskCheckTool";

export const metadata = {
  title: "Cek Risiko Gempa Saya — GempaWatch",
  description:
    "Apakah lokasi saya berada di zona rawan gempa? Cek jarak ke sesar, jumlah gempa historis, dan tingkat risiko tsunami.",
};

export default function RiskCheckPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Apakah Saya di Zona Risiko?
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Pilih lokasi untuk laporan risiko instan — jarak ke sesar terdekat, jumlah
          gempa M4+ dalam radius 50km sepanjang catatan sejarah, dan tingkat risiko
          tsunami jika berada di pesisir. Ini adalah indikator pola historis, bukan
          prediksi atau peringatan dini.
        </p>
      </div>
      <RiskCheckTool />
    </div>
  );
}

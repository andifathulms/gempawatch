import type { Metadata } from "next";
import "./globals.css";
import { NavHeader } from "@/components/ui/NavHeader";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "GempaWatch — Intelijen Risiko Gempa Indonesia",
  description:
    "Pahami risiko gempa di lokasi Anda berdasarkan data BMKG dan catatan seismik historis USGS. Bukan sistem peringatan dini — indikator pola historis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-earth-dark text-text-primary antialiased">
        <ToastProvider>
          <NavHeader />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-16 border-t border-earth-border">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-seismic-orange" />
                <span className="text-sm font-semibold tracking-tight text-text-primary">
                  GEMPA<span className="text-seismic-orange">WATCH</span>
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Data: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) &middot;
                USGS (United States Geological Survey)
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-earth-border bg-earth-surface px-4 py-3 text-xs leading-relaxed text-text-secondary">
              <strong className="font-semibold text-text-primary">Penting:</strong>{" "}
              GempaWatch menampilkan pola risiko historis, bukan prediksi, dan{" "}
              <strong className="font-semibold text-text-primary">
                bukan pengganti
              </strong>{" "}
              peringatan dini resmi BMKG. Untuk peringatan tsunami resmi, selalu rujuk{" "}
              <a
                href="https://www.bmkg.go.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-seismic-orange underline underline-offset-2 hover:brightness-110"
              >
                bmkg.go.id
              </a>
              .
            </div>
          </div>
        </footer>
        </ToastProvider>
      </body>
    </html>
  );
}

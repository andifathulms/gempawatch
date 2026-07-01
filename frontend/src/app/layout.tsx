import type { Metadata } from "next";
import "./globals.css";
import { NavHeader } from "@/components/ui/NavHeader";

export const metadata: Metadata = {
  title: "GempaWatch — Intelijen Risiko Gempa Indonesia",
  description:
    "Pahami risiko gempa di lokasi Anda berdasarkan data BMKG dan puluhan tahun catatan seismik USGS. Bukan sistem peringatan dini — indikator pola historis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-earth-dark text-text-primary antialiased">
        <NavHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-earth-border px-4 py-6 text-center text-xs text-text-muted">
          GempaWatch bukan pengganti peringatan dini resmi BMKG. Selalu rujuk{" "}
          <a
            href="https://www.bmkg.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text-secondary"
          >
            bmkg.go.id
          </a>{" "}
          untuk peringatan tsunami resmi.
        </footer>
      </body>
    </html>
  );
}

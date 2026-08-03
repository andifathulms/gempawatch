import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { MakerSignature } from "@/components/ui/MakerSignature";
import { NavHeader } from "@/components/ui/NavHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ToastProvider } from "@/components/ui/ToastProvider";

/**
 * Three voices, self-hosted by next/font so they are preloaded, subset, and
 * free of the layout shift a webfont @import causes.
 *
 * Space Grotesk carries headlines — its slightly technical, drafting-table
 * letterforms suit an instrument readout better than another neutral grotesk.
 * Inter runs the prose and UI. JetBrains Mono handles every figure on the site,
 * because its tabular numerals keep magnitudes and counts aligned in columns.
 */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html
      lang="id"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-earth-dark text-text-primary antialiased">
        <ToastProvider>
          <a href="#main" className="skip-link">
            Lompat ke konten utama
          </a>
          <NavHeader />
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            {children}
          </main>
          <SiteFooter>
            <MakerSignature />
          </SiteFooter>
        </ToastProvider>
      </body>
    </html>
  );
}

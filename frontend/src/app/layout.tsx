import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MakerSignature } from "@/components/ui/MakerSignature";
import { NavHeader } from "@/components/ui/NavHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

/**
 * Two voices, self-hosted by next/font so they are preloaded, subset, and free
 * of the layout shift a webfont @import causes.
 *
 * Plus Jakarta Sans runs headlines and prose (DESIGN.md §3.2). It was drawn by
 * the Indonesian foundry Tokotype for Jakarta's city identity — an Indonesian
 * typeface for an Indonesian instrument — with a confident 800 for the score
 * and place names and a calm 400 for reading.
 *
 * JetBrains Mono is kept only where digits must align in columns or read as
 * instrument output: coordinates, axis ticks, tables.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const TITLE = SITE_TITLE;
const DESCRIPTION = SITE_DESCRIPTION;

/**
 * NEXT_PUBLIC_SITE_URL must be the bare origin, with no path.
 *
 * Next already prefixes file-based metadata (icons, OG images) with basePath,
 * so folding the base path in here too yields /gempawatch/gempawatch/... and
 * every unfurl requests an image that does not exist.
 */
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  // See app/site.webmanifest/route.ts for why the manifest is not the
  // `app/manifest.ts` file convention.
  manifest: `${BASE_PATH}/site.webmanifest`,
  title: {
    default: TITLE,
    // Interior pages set their own full title; this covers any that don't.
    template: "%s — GempaWatch",
  },
  description: DESCRIPTION,
  applicationName: "GempaWatch",
  // Sharing is the product's main distribution channel — every WhatsApp
  // forward of a risk report is an unfurl — yet the site shipped no Open Graph
  // tags at all, so links arrived as bare URLs. Region and risk-result pages
  // override the image with their own generated card; this is the fallback.
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "GempaWatch",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: "GempaWatch",
    // Matches --earth-dark, so the iOS status bar blends into the page instead
    // of drawing a light strip above a dark app.
    statusBarStyle: "default",
  },
  formatDetection: {
    // Coordinates like "-0.9000, 119.8700" get auto-linked as phone numbers by
    // iOS Safari, which turns the readout on every risk report blue.
    telephone: false,
  },
};

export const viewport: Viewport = {
  // Mirrors --paper in each theme so the browser chrome and iOS status bar
  // blend into the page.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F6F3" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1214" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        <ToastProvider>
          <a href="#main" className="skip-link">
            Lompat ke konten utama
          </a>
          <SiteJsonLd />
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

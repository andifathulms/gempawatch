import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { MakerSignature } from "@/components/ui/MakerSignature";
import { NavHeader } from "@/components/ui/NavHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

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
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    // Coordinates like "-0.9000, 119.8700" get auto-linked as phone numbers by
    // iOS Safari, which turns the readout on every risk report blue.
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#121110",
  colorScheme: "dark",
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

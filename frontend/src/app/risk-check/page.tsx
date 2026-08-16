import { RouteStub } from "@/components/ui/RouteStub";
import { pageMetadata } from "@/lib/meta";

// Retired (DESIGN.md §10 step 5) — RiskCheckTool moved to "/" itself in step 4.
export const metadata = pageMetadata({
  title: "Cek Risiko Gempa Saya",
  description: "Cek risiko gempa lokasimu di beranda GempaWatch.",
  path: "/risk-check",
  canonicalPath: "/",
  noindex: true,
});

export default function RiskCheckPage() {
  return (
    <RouteStub
      to="/"
      message="Cek risiko sekarang ada di beranda."
    />
  );
}

import { Suspense } from "react";
import { pageMetadata } from "@/lib/meta";
import { CompareRedirect } from "./CompareRedirect";

// Retired (DESIGN.md §10 step 5) — replaced by SeismogramComparePicker's
// one-select reference trace inline on /region/[slug].
export const metadata = pageMetadata({
  title: "Bandingkan Wilayah",
  description: "Bandingkan profil risiko gempa dua wilayah di halaman wilayah GempaWatch.",
  path: "/compare",
  canonicalPath: "/",
  noindex: true,
});

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareRedirect />
    </Suspense>
  );
}

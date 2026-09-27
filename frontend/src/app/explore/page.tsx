import { RouteStub } from "@/components/ui/RouteStub";
import { pageMetadata } from "@/lib/meta";

// Retired (DESIGN.md §10 step 5). Browsing regions came back as /regions
// ("Wilayah", DESIGN.md §13) — grouped by island rather than a ranked list —
// so the old URL now lands there.
export const metadata = pageMetadata({
  title: "Jelajahi Wilayah",
  description: "Cari wilayahmu dan cek peringkat aktivitas seismiknya di GempaWatch.",
  path: "/explore",
  canonicalPath: "/regions",
  noindex: true,
});

export default function ExplorePage() {
  return (
    <RouteStub
      to="/regions"
      message="Daftar wilayah sekarang ada di halaman Wilayah."
    />
  );
}

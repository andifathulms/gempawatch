import { RouteStub } from "@/components/ui/RouteStub";
import { pageMetadata } from "@/lib/meta";

// Retired (DESIGN.md §10 step 5) — the full ranked list is gone; each region
// page now shows its own ranking as a single positioned row (DESIGN.md §7
// item 5), and the homepage carries a top-5 preview plus region search.
export const metadata = pageMetadata({
  title: "Jelajahi Wilayah",
  description: "Cari wilayahmu dan cek peringkat aktivitas seismiknya di GempaWatch.",
  path: "/explore",
  canonicalPath: "/",
  noindex: true,
});

export default function ExplorePage() {
  return (
    <RouteStub
      to="/"
      message="Cari wilayahmu dan lihat peringkat aktivitasnya dari beranda."
    />
  );
}

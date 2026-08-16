"use client";

import { useSearchParams } from "next/navigation";
import { RouteStub } from "@/components/ui/RouteStub";

/**
 * `/compare?a=&b=` retired (DESIGN.md §10 step 5) — comparison now lives
 * inline on region pages (SeismogramComparePicker, step 3). `a` is the
 * closest surviving equivalent of "which page did this reader want": send
 * them to that region, which already offers its own reference picker. `b`
 * has no destination to carry it to — nothing on `/region/[slug]` reads a
 * second region from the URL — so it is dropped rather than tacked on as a
 * param nothing consumes.
 */
export function CompareRedirect() {
  const searchParams = useSearchParams();
  const a = searchParams.get("a");
  const to = a ? `/region/${a}` : "/";

  return (
    <RouteStub
      to={to}
      message={
        a
          ? "Bandingkan wilayah sekarang ada langsung di halaman wilayah."
          : "Pilih wilayah dari beranda untuk melihat perbandingannya."
      }
    />
  );
}

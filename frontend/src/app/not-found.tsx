import { ButtonLink } from "@/components/ui/Button";

// Branded 404 — also shown when region/[slug] calls notFound() for an unknown slug.
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <span className="font-mono text-6xl font-bold tabular-nums text-seismic-orange">
        404
      </span>
      <div>
        <h1 className="text-fluid-2 font-bold tracking-tight text-text-primary">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-2 max-w-md text-fluid-00 leading-relaxed text-text-secondary">
          Wilayah atau halaman yang kamu cari tidak tersedia. Coba cari wilayah lain,
          atau langsung cek risiko untuk titik koordinat pilihanmu.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/explore">Jelajahi wilayah</ButtonLink>
        <ButtonLink href="/risk-check" variant="secondary">
          Cek risiko lokasiku
        </ButtonLink>
        <ButtonLink href="/" variant="ghost">
          Beranda
        </ButtonLink>
      </div>
    </div>
  );
}

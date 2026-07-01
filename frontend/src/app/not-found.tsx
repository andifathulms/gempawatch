import Link from "next/link";

// Branded 404 — also shown when region/[slug] calls notFound() for an unknown slug.
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="font-mono text-5xl font-bold text-seismic-orange">404</span>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Wilayah atau halaman yang kamu cari tidak tersedia. Coba cari wilayah lain
          atau kembali ke beranda.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/explore"
          className="rounded-lg bg-seismic-orange px-5 py-2.5 text-sm font-semibold text-earth-dark transition-[filter] duration-200 hover:brightness-110"
        >
          Jelajahi wilayah
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-earth-border px-5 py-2.5 text-sm text-text-secondary transition-colors hover:border-seismic-orange hover:text-text-primary"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

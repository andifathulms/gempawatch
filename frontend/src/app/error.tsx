"use client";

import Link from "next/link";
import { useEffect } from "react";

// Route-level error boundary. Catches render/data errors in any page segment
// and offers a recovery path instead of a blank crash.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for debugging; a real deployment would forward this to Sentry etc.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        ⚠️
      </span>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Terjadi kesalahan
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Maaf, halaman ini gagal dimuat. Ini kemungkinan masalah sementara pada
          koneksi data. Coba muat ulang, atau kembali ke beranda.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-seismic-orange px-5 py-2.5 text-sm font-semibold text-earth-dark transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          Coba lagi
        </button>
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

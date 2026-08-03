"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-risk-amber/15 text-risk-amber"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 6.5v4.2M10 13.8v.2M10 2.5 1.8 16.5h16.4L10 2.5Z" />
        </svg>
      </span>
      <div>
        <h1 className="text-fluid-2 font-bold tracking-tight text-text-primary">
          Terjadi kesalahan
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          Halaman ini gagal dimuat — kemungkinan besar gangguan sementara pada
          koneksi data. Coba muat ulang, atau kembali ke beranda. Untuk informasi
          gempa resmi, selalu tersedia di{" "}
          <a
            href="https://www.bmkg.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-seismic-bright underline underline-offset-2"
          >
            bmkg.go.id
          </a>
          .
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <ButtonLink href="/" variant="secondary">
          Kembali ke beranda
        </ButtonLink>
      </div>
    </div>
  );
}

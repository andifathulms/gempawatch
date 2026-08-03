"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself.
 *
 * It must render its own <html>/<body> because it replaces the root layout —
 * which also means the design tokens and webfonts are not guaranteed to be
 * present. Everything here is therefore inlined against literal values and
 * system fonts. Those literals are the only place in the codebase that
 * duplicates palette values, so they are labelled with their token names.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          background: "#121110", // --earth-dark
          color: "#f5f1ea", // --text-primary
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Terjadi kesalahan
          </h1>
          <p
            style={{
              marginTop: "0.5rem",
              color: "#b8b1a6", // --text-secondary
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            Aplikasi gagal dimuat. Silakan muat ulang halaman. Untuk informasi
            gempa resmi, kunjungi bmkg.go.id.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              background: "#e8743b", // --seismic-orange
              color: "#121110",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}

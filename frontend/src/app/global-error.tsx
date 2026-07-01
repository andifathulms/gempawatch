"use client";

// Last-resort boundary for errors thrown in the root layout itself.
// Must render its own <html>/<body> because it replaces the root layout.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          background: "#1a1a1a",
          color: "#f2ede4",
          fontFamily: "Inter, system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Terjadi kesalahan</h1>
          <p style={{ marginTop: "0.5rem", color: "#a8a39a", fontSize: "0.875rem" }}>
            Aplikasi gagal dimuat. Silakan muat ulang halaman.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              background: "#e8743b",
              color: "#1a1a1a",
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

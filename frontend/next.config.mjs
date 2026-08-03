/**
 * Two build targets share this config:
 *
 *   NEXT_PUBLIC_DATA_MODE=live    (default) → normal Next server, talks to Django
 *   NEXT_PUBLIC_DATA_MODE=static           → static export for GitHub Pages
 *
 * The static target needs a base path (project sites are served from
 * /<repo>/), unoptimized images (no server to resize them), and trailing
 * slashes so GitHub Pages resolves /about/ to about/index.html.
 */
const isStatic = process.env.NEXT_PUBLIC_DATA_MODE === "static";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Routes that only make sense with a backend are named `*.live.tsx`, and the
 * extension is only registered for live builds. This is how they disappear from
 * static exports without being deleted: `output: export` rejects any dynamic
 * route whose generateStaticParams comes back empty, so a route serving an
 * unbounded key space (arbitrary coordinates, unguessable unsubscribe tokens)
 * cannot merely opt out — it has to not exist.
 */
const pageExtensions = isStatic
  ? ["tsx", "ts", "jsx", "js"]
  : ["live.tsx", "live.ts", "tsx", "ts", "jsx", "js"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "data.bmkg.go.id" },
    ],
    // Next's image optimizer is a server feature; a static host serves the raw file.
    unoptimized: isStatic,
  },
  ...(isStatic
    ? {
        output: "export",
        trailingSlash: true,
        basePath: basePath || undefined,
      }
    : {}),
};

export default nextConfig;

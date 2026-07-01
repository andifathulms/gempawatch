/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "data.bmkg.go.id" },
    ],
  },
};

export default nextConfig;

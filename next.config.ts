import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin Turbopack workspace root to this project (avoids picking up ~/pnpm-lock.yaml).
  turbopack: {
    root: __dirname,
  },
  images: {
    // Local public/ assets only; no remote hosts needed yet.
    formats: ["image/avif", "image/webp"],
  },
  // Subdomain routing handled in middleware.ts
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default config;

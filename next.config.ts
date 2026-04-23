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
  // Subdomain routing via native Next.js rewrites (more reliable than middleware with CDN cache).
  // vault.carnivon.io/* → /vault/*
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "vault.carnivon.io" }],
          destination: "/vault",
        },
        {
          // Match any path that is NOT already under /vault and NOT a Next.js
          // internal asset/route. `admin` is excluded so the operator console
          // stays reachable on the vault subdomain where the session cookie
          // lives (AUTH_URL=https://vault.carnivon.io).
          source:
            "/:path((?!vault|admin|_next|api|favicon|robots|sitemap|logo).*)*",
          has: [{ type: "host", value: "vault.carnivon.io" }],
          destination: "/vault/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
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

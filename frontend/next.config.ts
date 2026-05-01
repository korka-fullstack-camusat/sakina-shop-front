import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Compression ───────────────────────────────────────────────────────────
  compress: true,   // Brotli + Gzip sur tous les assets Next.js

  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost",            port: "8000", pathname: "/uploads/**" },
      { protocol: "http",  hostname: "127.0.0.1",           port: "8000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com"      },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
    // Formats modernes pour les images next/image (pas utilisé pour base64, mais bon à avoir)
    formats: ["image/avif", "image/webp"],
  },

  // ── Headers HTTP – cache long durée pour les assets statiques ────────────
  async headers() {
    return [
      {
        // JS, CSS, fonts, images statiques → cache 1 an (immutable)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Favicon, logo, images publiques → cache 7 jours
        source: "/:path(.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff2?))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Pages HTML → pas de cache (toujours frais) pour éviter les contenus obsolètes
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },

  // ── Optimisations build ───────────────────────────────────────────────────
  poweredByHeader: false,   // retire le header "X-Powered-By: Next.js" (sécurité)

  experimental: {
    // Optimise l'import des packages CSS/JS lourds
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },
};

export default nextConfig;

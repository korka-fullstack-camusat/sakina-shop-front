import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Stockage local (développement)
      { protocol: "http",  hostname: "localhost",            port: "8000", pathname: "/uploads/**" },
      { protocol: "http",  hostname: "127.0.0.1",           port: "8000", pathname: "/uploads/**" },
      // Amazon S3 (production)
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com"      },
      // Cloudflare R2 / autre CDN éventuel
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // QUAN TRỌNG: Cần thiết cho Docker multi-stage build
  // Tạo ra thư mục .next/standalone chứa tất cả để chạy độc lập
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // Redirect www → non-www (hoặc ngược lại)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.YOURDOMAIN.COM" }],
        destination: "https://YOURDOMAIN.COM/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

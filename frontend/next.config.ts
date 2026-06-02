import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence workspace root warning
  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "i9.ytimg.com",
      },
    ],
  },

  // Proxy API requests to the backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1").replace(/\/api\/v1\/?$/, "")}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    contentDispositionType: 'inline',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

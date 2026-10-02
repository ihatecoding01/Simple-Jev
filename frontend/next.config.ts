import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
const isCloudflare = process.env.CF_PAGES === '1' || process.env.CF_PAGES === 'true';
const isExport = process.env.NEXT_EXPORT === 'true' || isCloudflare || !isDev;
const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: 'export',
        images: {
          unoptimized: true,
        },
      }
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${backendUrl}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;


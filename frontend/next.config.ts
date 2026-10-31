import type { NextConfig } from "next";

const API_UPSTREAM = process.env.API_UPSTREAM || "http://127.0.0.1:8000";
const staticExport = process.env.STATIC_EXPORT === "1";
/** En GitHub project pages: /lapsoe-machinery */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(staticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${API_UPSTREAM}/api/:path*`,
            },
            {
              source: "/backend/:path*",
              destination: `${API_UPSTREAM}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;

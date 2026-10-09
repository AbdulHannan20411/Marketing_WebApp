import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { UMAMI_ORIGINS } from "./lib/analytics";
import { buildSecurityHeaders } from "./lib/security/headers";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Styled 404 for URLs outside /en and /ur (app/global-not-found.tsx).
    globalNotFound: true,
    serverActions: {
      // Query attachments are up to 5 MB; allow for multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // HarfBuzz loads its WebAssembly file from its own folder at runtime (OG images).
  serverExternalPackages: ["harfbuzzjs"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          isDev,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          analyticsOrigins: process.env.NEXT_PUBLIC_ANALYTICS_ID ? UMAMI_ORIGINS : [],
        }),
      },
    ];
  },
};

export default withNextIntl(nextConfig);

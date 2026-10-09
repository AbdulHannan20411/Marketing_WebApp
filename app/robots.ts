import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n/routing";
import { privatePathPrefixes } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/** robots.txt: crawl the public site; keep accounts, admin, auth and the API out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...locales.flatMap((locale) => privatePathPrefixes.map((prefix) => `/${locale}${prefix}`)),
      ],
    },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}

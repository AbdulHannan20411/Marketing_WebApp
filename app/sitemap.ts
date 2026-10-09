import type { MetadataRoute } from "next";

import { localeMeta, locales } from "@/lib/i18n/routing";
import { localizedPath, publicPaths } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/** sitemap.xml: every public page in both languages, with hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (path: string) => new URL(path, siteConfig.url).toString();

  return publicPaths.flatMap((path) => {
    const languages: Record<string, string> = Object.fromEntries(
      locales.map((locale) => [localeMeta[locale].htmlLang, absolute(localizedPath(locale, path))]),
    );
    languages["x-default"] = absolute(localizedPath("en", path));

    return locales.map((locale) => ({
      url: absolute(localizedPath(locale, path)),
      changeFrequency: path === "/pricing" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : path === "/pricing" || path === "/features" ? 0.9 : 0.7,
      alternates: { languages },
    }));
  });
}

import type { Metadata } from "next";

import { localeMeta, locales, type Locale } from "@/lib/i18n/routing";

/** Absolute path for a locale-less route, e.g. ("ur", "/features") → "/ur/features". */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path;
  return `/${locale}${clean}`;
}

/**
 * Per-page metadata: title, description, canonical URL and hreflang alternates for
 * both locales (with English as x-default). Relative URLs resolve against the
 * `metadataBase` set in the root layout.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** Use the title as-is, without the "| NextReach" template (home page). */
  absoluteTitle?: boolean;
}): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    locales.map((code) => [localeMeta[code].htmlLang, localizedPath(code, path)]),
  );
  languages["x-default"] = localizedPath("en", path);

  const url = localizedPath(locale, path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      url,
      title,
      description,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales
        .filter((code) => code !== locale)
        .map((code) => localeMeta[code].ogLocale),
    },
  };
}

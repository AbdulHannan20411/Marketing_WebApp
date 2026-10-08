import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ur"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every URL carries its locale (/en/..., /ur/...), which keeps caching and hreflang simple.
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    // One year; the cookie only remembers an explicit language choice.
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});

/** Writing direction and BCP 47 tags per locale. */
export const localeMeta: Record<
  Locale,
  { dir: "ltr" | "rtl"; htmlLang: string; ogLocale: string }
> = {
  en: { dir: "ltr", htmlLang: "en", ogLocale: "en_PK" },
  ur: { dir: "rtl", htmlLang: "ur", ogLocale: "ur_PK" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return localeMeta[locale].dir;
}

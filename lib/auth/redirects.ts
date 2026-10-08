import { isLocale, type Locale } from "@/lib/i18n/routing";

/**
 * Returns `next` only if it is a same-site path inside the site's locales
 * (e.g. /en/account/queries/123); otherwise the fallback. Blocks open redirects such
 * as //evil.com, https://evil.com and /\evil.com.
 */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  let url: URL;
  try {
    url = new URL(next, "https://placeholder.invalid");
  } catch {
    return fallback;
  }
  if (url.origin !== "https://placeholder.invalid") return fallback;
  const locale = url.pathname.split("/")[1];
  if (!isLocale(locale)) return fallback;
  return `${url.pathname}${url.search}`;
}

export const accountHome = (locale: Locale) => `/${locale}/account`;
export const signInPath = (locale: Locale) => `/${locale}/sign-in`;

/** Areas that need a signed-in user, and the auth pages signed-in users skip. */
export function classifyPath(pathname: string): "protected" | "guest-only" | "public" {
  const [, locale, section] = pathname.split("/");
  if (!isLocale(locale)) return "public";
  if (section === "account" || section === "admin") return "protected";
  if (section === "sign-in" || section === "sign-up") return "guest-only";
  return "public";
}

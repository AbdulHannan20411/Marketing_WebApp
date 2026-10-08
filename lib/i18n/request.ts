import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import { routing, type Locale } from "./routing";

/**
 * Resolves the locale for next-intl's server APIs.
 *
 * Server Components read it from the `[locale]` root param (`next/root-params`), which
 * keeps pages statically prerenderable under Cache Components. Root params are not
 * available in Server Actions or Route Handlers; those callers pass the locale
 * explicitly (`getTranslations({ locale, namespace })`), and the header set by the
 * next-intl proxy is the last resort.
 *
 * `params.requestLocale` is a getter that reads `headers()`, which would make the
 * route dynamic, so it is only touched when the root param is unavailable.
 */
export default getRequestConfig(async (params) => {
  let resolved: Locale;

  if (hasLocale(routing.locales, params.locale)) {
    resolved = params.locale;
  } else {
    let candidate: string | undefined;
    try {
      candidate = await rootLocale();
    } catch {
      candidate = await params.requestLocale;
    }
    resolved = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;
  }

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
    timeZone: "Asia/Karachi",
  };
});

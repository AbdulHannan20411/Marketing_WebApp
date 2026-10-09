import { isFeatureSlug } from "@/content/feature-slugs";

import { isLocale } from "./routing";

/** Generated metadata images, e.g. "opengraph-image" or "opengraph-image-abc123". */
const OG_IMAGE = /^(opengraph|twitter)-image(-[\w-]+)?$/;

/**
 * Detects requests for dynamic routes whose param is not a real page, e.g.
 * /en/features/not-a-feature.
 *
 * Under Cache Components, an unknown param is served the route's prerendered shell
 * with a 200 before the page can call notFound(). The proxy uses this to send such
 * requests to the catch-all route instead, which responds with a real 404.
 */
export function isUnknownDynamicPath(pathname: string): boolean {
  const [, locale, section, slug, ...rest] = pathname.split("/");
  if (!isLocale(locale) || section !== "features" || slug === undefined || slug === "") {
    return false;
  }
  if (!isFeatureSlug(decodeURIComponent(slug))) return true;
  // A real feature page may serve its generated social image; anything else is unknown.
  const extra = rest.filter(Boolean);
  return extra.length > 0 && !(extra.length === 1 && OG_IMAGE.test(extra[0]!));
}

/** Path the proxy rewrites unknown dynamic paths to (matched by the catch-all route). */
export function notFoundRewritePath(pathname: string): string {
  const locale = pathname.split("/")[1];
  return `/${isLocale(locale) ? locale : "en"}/_not-found`;
}

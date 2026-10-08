import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { isUnknownDynamicPath, notFoundRewritePath } from "@/lib/i18n/route-guards";
import { routing } from "@/lib/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Refresh the Supabase session first so rendering sees up-to-date auth cookies.
  const session = await refreshSupabaseSession(request);

  // 2. Unknown feature slugs get a real 404 status (see route-guards.ts).
  const { pathname } = request.nextUrl;
  if (isUnknownDynamicPath(pathname)) {
    return session.apply(NextResponse.rewrite(new URL(notFoundRewritePath(pathname), request.url)));
  }

  // 3. Locale negotiation, redirects (/ → /en) and the hreflang Link header.
  const response = handleI18nRouting(request);

  // 4. Carry refreshed auth cookies onto whatever response next-intl produced.
  return session.apply(response);
}

export const config = {
  // Everything except Next internals, API routes and files with an extension
  // (static assets, sitemap.xml, robots.txt, OG images).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

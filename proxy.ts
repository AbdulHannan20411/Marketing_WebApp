import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { classifyPath } from "@/lib/auth/redirects";
import { isUnknownDynamicPath, notFoundRewritePath } from "@/lib/i18n/route-guards";
import { routing } from "@/lib/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Refresh the Supabase session first so rendering sees up-to-date auth cookies.
  const session = await refreshSupabaseSession(request);
  const { pathname, search } = request.nextUrl;

  // 2. Optimistic auth routing. The real checks are in layouts, server actions and RLS.
  const area = classifyPath(pathname);
  const locale = pathname.split("/")[1];
  if (area === "protected" && !session.userId) {
    const signIn = new URL(`/${locale}/sign-in`, request.url);
    signIn.searchParams.set("next", `${pathname}${search}`);
    return session.apply(NextResponse.redirect(signIn));
  }
  if (area === "guest-only" && session.userId) {
    return session.apply(NextResponse.redirect(new URL(`/${locale}/account`, request.url)));
  }

  // 3. Unknown feature slugs get a real 404 status (see route-guards.ts).
  if (isUnknownDynamicPath(pathname)) {
    return session.apply(NextResponse.rewrite(new URL(notFoundRewritePath(pathname), request.url)));
  }

  // 4. Locale negotiation, redirects (/ → /en) and the hreflang Link header.
  const response = handleI18nRouting(request);

  // 5. Carry refreshed auth cookies onto whatever response next-intl produced.
  return session.apply(response);
}

export const config = {
  // Everything except Next internals, API routes and files with an extension
  // (static assets, sitemap.xml, robots.txt, OG images).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

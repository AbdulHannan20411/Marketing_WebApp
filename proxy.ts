import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/lib/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Refresh the Supabase session first so rendering sees up-to-date auth cookies.
  const session = await refreshSupabaseSession(request);

  // 2. Locale negotiation, redirects (/ → /en) and the hreflang Link header.
  const response = handleI18nRouting(request);

  // 3. Carry refreshed auth cookies onto whatever response next-intl produced.
  return session.apply(response);
}

export const config = {
  // Everything except Next internals, API routes and files with an extension
  // (static assets, sitemap.xml, robots.txt, OG images).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

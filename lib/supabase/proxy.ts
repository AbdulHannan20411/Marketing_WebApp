import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/lib/env/public";

type PendingCookie = { name: string; value: string; options: CookieOptions };

export type SessionRefresh = {
  /** Copies refreshed auth cookies (and no-cache headers) onto the final response. */
  apply: (response: NextResponse) => NextResponse;
  /** Verified user id from the JWT claims, or null when signed out / not configured. */
  userId: string | null;
};

/**
 * Refreshes the Supabase session for this request.
 *
 * Runs before the i18n proxy: refreshed cookies are written onto `request.cookies`
 * (which next-intl forwards to rendering), and later onto whatever response the i18n
 * proxy produces (next, rewrite or redirect).
 */
export async function refreshSupabaseSession(request: NextRequest): Promise<SessionRefresh> {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { apply: (response) => response, userId: null };
  }

  const pendingCookies: PendingCookie[] = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        pendingCookies.push(...cookiesToSet);
        Object.assign(pendingHeaders, headers);
      },
    },
  });

  // getClaims() verifies the JWT (and refreshes an expired session). Do not put any
  // logic between creating the client and this call.
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  } catch (error) {
    console.error("[proxy] Supabase session refresh failed", error);
  }

  return {
    userId,
    apply(response) {
      for (const { name, value, options } of pendingCookies) {
        response.cookies.set(name, value, options);
      }
      for (const [key, value] of Object.entries(pendingHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    },
  };
}

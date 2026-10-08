import "server-only";

import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env/public";
import type { Locale } from "@/lib/i18n/routing";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signInPath } from "./redirects";

export type CurrentProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "full_name" | "phone" | "locale" | "role" | "is_suspended"
>;

/**
 * The signed-in user's profile, or null. Verifies the JWT (getClaims) and reads the
 * profile under RLS. Cached per request, so layouts, pages and actions share one read.
 * Reads cookies: call it inside a <Suspense> boundary under Cache Components.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  if (!isSupabaseConfigured()) return null;
  // Auth checks compare token expiry with the current time and call Supabase over the
  // network, so they must never run inside a (runtime) prerender: connection() keeps
  // this to the actual request.
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, locale, role, is_suspended")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] profile lookup failed", { userId, error: error.message });
    return null;
  }
  return data;
});

/** Signed-in, active user or a redirect to sign in (suspended users are signed out). */
export async function requireUser(locale: Locale, nextPath: string): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`${signInPath(locale)}?next=${encodeURIComponent(nextPath)}`);
  }
  if (profile.is_suspended) {
    // Server Components cannot clear cookies; the sign-out route does it.
    redirect(`/${locale}/auth/sign-out?reason=suspended`);
  }
  return profile;
}

/** Active Super Admin, or a 404 (the admin area is not advertised to others). */
export async function requireSuperadmin(locale: Locale): Promise<CurrentProfile> {
  const profile = await requireUser(locale, `/${locale}/admin`);
  if (profile.role !== "superadmin") notFound();
  return profile;
}

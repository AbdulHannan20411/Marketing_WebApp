import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env/public";

import type { Database } from "./database.types";
import { serverEnv } from "@/lib/env/server";

/**
 * Service-role Supabase client. Bypasses RLS, so use it only in trusted server code
 * (Server Actions, Route Handlers, scripts) after doing your own authorization checks,
 * for example inserting a visitor's query. Never import it from client code; the
 * `server-only` import makes that a build error.
 */
export function createSupabaseAdminClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

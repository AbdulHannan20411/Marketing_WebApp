import { z } from "../validation/zod";

import { optionalString, optionalUrl, urlWithDefault } from "./schema-helpers";

/**
 * Public (browser-safe) environment variables.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time only when the property is
 * accessed literally, so each variable is read by name below rather than by iterating.
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: urlWithDefault("http://localhost:3000"),
  // Angular's dev-server default. Production builds warn when this is not set.
  NEXT_PUBLIC_APP_URL: urlWithDefault("http://localhost:4200"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  NEXT_PUBLIC_ANALYTICS_ID: optionalString,
  TURNSTILE_SITE_KEY: optionalString,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const result = publicEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid public environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const publicEnv: PublicEnv = parsePublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID ?? "",
  // The Turnstile site key is public by design; it is read on the server and passed
  // to the widget as a prop, so it does not need the NEXT_PUBLIC_ prefix.
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY ?? "",
});

if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
  for (const name of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    if (!process.env[name]) {
      console.warn(`[env] ${name} is not set; using ${publicEnv[name]}. Set it for production.`);
    }
  }
}

/** True when the browser-safe Supabase settings are present. */
export function isSupabaseConfigured(env: PublicEnv = publicEnv): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

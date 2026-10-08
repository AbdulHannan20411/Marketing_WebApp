import "server-only";

import { z } from "zod";

import { optionalBaseUrl, optionalString } from "./schema-helpers";

/**
 * Server-only secrets. Importing this module from a Client Component fails the build
 * (`server-only`), which is what keeps the service-role key out of browser bundles.
 */
export const serverEnvSchema = z.object({
  NEXTREACH_API_URL: optionalBaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  TURNSTILE_SECRET_KEY: optionalString,
  REVALIDATE_SECRET: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid server environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const serverEnv: ServerEnv = parseServerEnv({
  NEXTREACH_API_URL: process.env.NEXTREACH_API_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "",
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY ?? "",
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET ?? "",
});

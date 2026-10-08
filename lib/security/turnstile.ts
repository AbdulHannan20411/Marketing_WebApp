import "server-only";

import { serverEnv } from "@/lib/env/server";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Turnstile is optional: it is enforced only when TURNSTILE_SECRET_KEY is set. */
export function isTurnstileEnabled(): boolean {
  return Boolean(serverEnv.TURNSTILE_SECRET_KEY);
}

/** Verifies a Turnstile token with Cloudflare. Fails closed when enabled. */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const secret = serverEnv.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const response = await fetchImpl(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!result.success) {
      console.warn("[turnstile] verification failed", { codes: result["error-codes"] });
    }
    return result.success === true;
  } catch (error) {
    console.error("[turnstile] verification error", { error: String(error) });
    return false;
  }
}

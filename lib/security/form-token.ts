import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env/server";

/**
 * Signed "form opened at" tokens for anti-bot timing. The browser cannot forge the
 * time, unlike a plain timestamp field. The key is derived from the service-role key
 * (no extra secret to manage); without it, a per-process random key is used.
 */
const key: Buffer = serverEnv.SUPABASE_SERVICE_ROLE_KEY
  ? createHash("sha256")
      .update(`nextreach:form-token:${serverEnv.SUPABASE_SERVICE_ROLE_KEY}`)
      .digest()
  : randomBytes(32);

/** Salt for hashing visitor IPs, derived the same way. */
export const ipHashSalt: Buffer = createHash("sha256")
  .update(Buffer.concat([key, Buffer.from(":ip")]))
  .digest();

function sign(payload: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function issueFormToken(now = Date.now()): string {
  const payload = String(now);
  return `${payload}.${sign(payload)}`;
}

export type TokenCheck = "ok" | "invalid" | "tooFast" | "expired";

/** At least `minAgeMs` since the form opened, and not older than `maxAgeMs`. */
export function checkFormToken(
  token: string,
  { now = Date.now(), minAgeMs = 3000, maxAgeMs = 24 * 60 * 60 * 1000 } = {},
): TokenCheck {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !/^\d{13}$/.test(payload)) return "invalid";
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  const age = now - Number(payload);
  if (age < minAgeMs) return "tooFast";
  if (age > maxAgeMs) return "expired";
  return "ok";
}

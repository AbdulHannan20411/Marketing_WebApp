import "server-only";

import { createHmac } from "node:crypto";

import { ipHashSalt } from "./form-token";

/**
 * Best-effort client IP from proxy headers (Vercel sets x-forwarded-for / x-real-ip).
 * Only ever stored as a salted hash.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function hashIp(ip: string): string {
  return createHmac("sha256", ipHashSalt).update(ip).digest("hex");
}

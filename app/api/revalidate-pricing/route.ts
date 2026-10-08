import { createHash, timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { serverEnv } from "@/lib/env/server";
import { PRICING_CACHE_TAG } from "@/lib/nextreach-api";

/** Constant-time comparison (hashing first makes both inputs the same length). */
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * POST /api/revalidate-pricing with header `x-revalidate-secret` refreshes live prices
 * without a deploy. Prices are expired immediately, so the next visit fetches fresh ones.
 */
export async function POST(request: Request) {
  const expected = serverEnv.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret") ?? "";

  if (!expected) {
    console.error("[revalidate-pricing] REVALIDATE_SECRET is not set; refusing request");
    return Response.json({ revalidated: false }, { status: 503 });
  }

  if (!provided || !secretsMatch(provided, expected)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  revalidateTag(PRICING_CACHE_TAG, { expire: 0 });
  return Response.json({ revalidated: true, tag: PRICING_CACHE_TAG });
}

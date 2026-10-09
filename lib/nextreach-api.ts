import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "@/lib/validation/zod";

import { serverEnv } from "@/lib/env/server";
import { fetchResource, type ApiResult } from "@/lib/pricing/fetch-resource";
import {
  customPlanOfferSchema,
  planSchema,
  type CustomPlanOffer,
  type Plan,
} from "@/lib/pricing/schemas";

/**
 * Server-only client for the NextReach public pricing API.
 *
 * Caching follows the Cache Components model (fetch `next.revalidate` options do not
 * cache on their own here): results are cached for 10 minutes under the `pricing` tag,
 * so `revalidateTag('pricing')` refreshes them on demand. Failures are cached for only
 * a minute so the site recovers quickly once the API is back.
 */

export const PRICING_CACHE_TAG = "pricing";

const plansSchema = z.array(planSchema);

export async function getPublicPlans(): Promise<ApiResult<Plan[]>> {
  "use cache";
  cacheTag(PRICING_CACHE_TAG);

  const result = await fetchResource(plansSchema, {
    baseUrl: serverEnv.NEXTREACH_API_URL,
    path: "/api/v1/public/plans",
  });

  if (!result.ok) {
    cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
    return result;
  }

  cacheLife({ stale: 300, revalidate: 600, expire: 86_400 });
  // Keep the API's display order.
  return { ok: true, data: [...result.data].sort((a, b) => a.sortOrder - b.sortOrder) };
}

export async function getCustomPlanOffer(): Promise<ApiResult<CustomPlanOffer>> {
  "use cache";
  cacheTag(PRICING_CACHE_TAG);

  const result = await fetchResource(customPlanOfferSchema, {
    baseUrl: serverEnv.NEXTREACH_API_URL,
    path: "/api/v1/public/custom-plan",
  });

  if (!result.ok) {
    cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
    return result;
  }

  cacheLife({ stale: 300, revalidate: 600, expire: 86_400 });
  return result;
}

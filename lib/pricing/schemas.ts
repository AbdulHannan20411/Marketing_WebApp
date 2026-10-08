import { z } from "zod";

/**
 * Zod schemas mirroring the NextReach public pricing API.
 *
 * Lenient about extra fields (Zod objects strip unknown keys), strict about the
 * fields this site uses. `null` limits mean "unlimited".
 */

const limit = z.number().int().nullable();

export const planLimitsSchema = z.object({
  maxEmployees: limit,
  maxContacts: limit,
  maxCampaigns: limit,
  maxWhatsAppAccounts: limit,
  maxStorageMb: limit,
  dailyMessageLimit: limit,
  monthlyMessageLimit: limit,
  monthlyAiReplyLimit: limit,
  maxSearchRadiusKm: limit,
  maxActiveAutomations: limit,
});

export const supportLevels = ["community", "email", "priority", "dedicated"] as const;

export const planSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().nullable().default(null),
  monthlyPrice: z.number().nonnegative(),
  yearlyPrice: z.number().nonnegative(),
  currency: z.string().length(3),
  trialDays: z.number().int().nonnegative(),
  discountPercent: z.number().min(0).max(100).default(0),
  isPromotional: z.boolean().default(false),
  isMostPopular: z.boolean(),
  isRecommended: z.boolean(),
  supportLevel: z.enum(supportLevels),
  modules: z.record(z.string(), z.boolean()),
  limits: planLimitsSchema,
  highlights: z.array(z.string()),
  sortOrder: z.number(),
  autoReplyTriggers: z.record(z.string(), z.boolean()).default({}),
});

export const customPlanOfferSchema = z.object({
  enabled: z.boolean(),
  currency: z.string(),
  startingMonthlyPrice: z.number().nonnegative(),
  startingYearlyPrice: z.number().nonnegative(),
  yearlyDiscountPercent: z.number().min(0).max(100),
  trialDays: z.number().int().nonnegative(),
  includedModules: z.array(z.string()),
  modulePrices: z.record(z.string(), z.number().nonnegative()),
});

/** Every success response is wrapped as `{ data, message, traceId }`. */
export function envelope<T extends z.ZodType>(data: T) {
  return z.object({
    data,
    message: z.string().nullable().optional(),
    traceId: z.string().nullable().optional(),
  });
}

export type Plan = z.infer<typeof planSchema>;
export type PlanLimits = z.infer<typeof planLimitsSchema>;
export type SupportLevel = (typeof supportLevels)[number];
export type CustomPlanOffer = z.infer<typeof customPlanOfferSchema>;

import { isModuleKey, moduleKeys, type ModuleKey } from "@/content/modules";
import type { Locale } from "@/lib/i18n/routing";

import {
  formatLimit,
  formatMoney,
  formatSearchRadius,
  formatStorage,
  yearlySavingPercent,
  type LimitLabels,
} from "./format";
import type { CustomPlanOffer, Plan, PlanLimits, SupportLevel } from "./schemas";

/**
 * Turns API plans into display-ready data. Pure and server-side: every string is
 * formatted here, so the client toggle only switches between ready-made values.
 */

export const autoReplyKeys = ["greeting", "first_message", "unanswered"] as const;
export type AutoReplyKey = (typeof autoReplyKeys)[number];

export const limitRows = [
  "contacts",
  "employees",
  "campaigns",
  "whatsappNumbers",
  "dailyMessages",
  "monthlyMessages",
  "aiReplies",
  "automations",
  "storage",
  "searchRadius",
] as const;
export type LimitRow = (typeof limitRows)[number];

const limitField: Record<Exclude<LimitRow, "storage" | "searchRadius">, keyof PlanLimits> = {
  contacts: "maxContacts",
  employees: "maxEmployees",
  campaigns: "maxCampaigns",
  whatsappNumbers: "maxWhatsAppAccounts",
  dailyMessages: "dailyMessageLimit",
  monthlyMessages: "monthlyMessageLimit",
  aiReplies: "monthlyAiReplyLimit",
  automations: "maxActiveAutomations",
};

/** Limits shown on each plan card (the full set is in the comparison table). */
const cardLimitRows = ["contacts", "employees", "whatsappNumbers", "monthlyMessages"] as const;

export type PricingLabels = {
  limits: LimitLabels;
  module: (key: ModuleKey) => string;
  limit: (row: LimitRow | "support") => string;
  support: (level: SupportLevel) => string;
  autoReply: (key: AutoReplyKey) => string;
  perMonth: string;
  perYear: string;
  approxPerMonth: (price: string) => string;
  save: (percent: number) => string;
  promo: (percent: number) => string;
  trial: (days: number) => string;
  startTrial: string;
  getStarted: string;
  ctaLabel: (action: string, plan: string) => string;
};

export type PlanCard = {
  id: string;
  name: string;
  tagline: string | null;
  badge: "mostPopular" | "recommended" | null;
  promo: string | null;
  monthly: { price: string; period: string };
  yearly: { price: string; period: string; perMonth: string; saving: string | null };
  trial: string | null;
  cta: { label: string; ariaLabel: string; href: string };
  highlights: string[];
  modules: string[];
  autoReplies: string[];
  limits: { label: string; value: string }[];
  support: string;
};

function limitValue(locale: Locale, plan: Plan, row: LimitRow, labels: LimitLabels): string {
  if (row === "storage") return formatStorage(locale, plan.limits.maxStorageMb, labels);
  if (row === "searchRadius")
    return formatSearchRadius(locale, plan.limits.maxSearchRadiusKm, labels);
  return formatLimit(locale, plan.limits[limitField[row]], labels);
}

/** Modules switched on for a plan, in display order. Unknown keys (email, social, api) are ignored. */
export function enabledModules(plan: Pick<Plan, "modules">): ModuleKey[] {
  return moduleKeys.filter((key) => plan.modules[key] === true);
}

export function buildPlanCard(
  plan: Plan,
  locale: Locale,
  labels: PricingLabels,
  checkoutUrl: string,
): PlanCard {
  const saving = yearlySavingPercent(plan);
  const action = plan.trialDays > 0 ? labels.startTrial : labels.getStarted;
  const autoReplies =
    plan.modules.ai === true
      ? autoReplyKeys.filter((key) => plan.autoReplyTriggers[key] === true).map(labels.autoReply)
      : [];

  return {
    id: plan.id,
    name: plan.name,
    tagline: plan.tagline,
    badge: plan.isMostPopular ? "mostPopular" : plan.isRecommended ? "recommended" : null,
    promo:
      plan.isPromotional && plan.discountPercent > 0 ? labels.promo(plan.discountPercent) : null,
    monthly: {
      price: formatMoney(locale, plan.monthlyPrice, plan.currency),
      period: labels.perMonth,
    },
    yearly: {
      price: formatMoney(locale, plan.yearlyPrice, plan.currency),
      period: labels.perYear,
      perMonth: labels.approxPerMonth(
        formatMoney(locale, Math.round(plan.yearlyPrice / 12), plan.currency),
      ),
      saving: saving > 0 ? labels.save(saving) : null,
    },
    trial: plan.trialDays > 0 ? labels.trial(plan.trialDays) : null,
    cta: { label: action, ariaLabel: labels.ctaLabel(action, plan.name), href: checkoutUrl },
    highlights: plan.highlights,
    modules: enabledModules(plan).map(labels.module),
    autoReplies,
    limits: cardLimitRows.map((row) => ({
      label: labels.limit(row),
      value: limitValue(locale, plan, row, labels.limits),
    })),
    support: labels.support(plan.supportLevel),
  };
}

/** Largest yearly saving across plans, for the "Save up to" badge on the toggle. */
export function maxYearlySaving(plans: Plan[]): number {
  return plans.reduce((max, plan) => Math.max(max, yearlySavingPercent(plan)), 0);
}

export type ComparisonCell = { kind: "check"; included: boolean } | { kind: "text"; value: string };
export type ComparisonRow = { key: string; label: string; cells: ComparisonCell[] };
export type ComparisonTable = {
  columns: { id: string; name: string }[];
  groups: { key: "modules" | "limits" | "support"; rows: ComparisonRow[] }[];
};

/** Rows: the nine modules, then the limits in the brief's order, then support. */
export function buildComparison(
  plans: Plan[],
  locale: Locale,
  labels: PricingLabels,
): ComparisonTable {
  return {
    columns: plans.map((plan) => ({ id: plan.id, name: plan.name })),
    groups: [
      {
        key: "modules",
        rows: moduleKeys.map((key) => ({
          key,
          label: labels.module(key),
          cells: plans.map((plan) => ({ kind: "check", included: plan.modules[key] === true })),
        })),
      },
      {
        key: "limits",
        rows: limitRows.map((row) => ({
          key: row,
          label: labels.limit(row),
          cells: plans.map((plan) => ({
            kind: "text",
            value: limitValue(locale, plan, row, labels.limits),
          })),
        })),
      },
      {
        key: "support",
        rows: [
          {
            key: "support",
            label: labels.limit("support"),
            cells: plans.map((plan) => ({
              kind: "text",
              value: labels.support(plan.supportLevel),
            })),
          },
        ],
      },
    ],
  };
}

export type CustomPlanCard = {
  monthlyPrice: string;
  yearlyPrice: string;
  yearlyDiscountPercent: number;
  trial: string | null;
  alwaysIncluded: string[];
  addOns: { key: ModuleKey; label: string; price: string }[];
};

/** `null` when the offer is disabled: everything about building your own plan is hidden. */
export function buildCustomPlanCard(
  offer: CustomPlanOffer,
  locale: Locale,
  labels: Pick<PricingLabels, "module" | "trial">,
  addOnPrice: (price: string) => string,
): CustomPlanCard | null {
  if (!offer.enabled) return null;
  return {
    monthlyPrice: formatMoney(locale, offer.startingMonthlyPrice, offer.currency),
    yearlyPrice: formatMoney(locale, offer.startingYearlyPrice, offer.currency),
    yearlyDiscountPercent: offer.yearlyDiscountPercent,
    trial: offer.trialDays > 0 ? labels.trial(offer.trialDays) : null,
    alwaysIncluded: offer.includedModules.filter(isModuleKey).map(labels.module),
    addOns: Object.entries(offer.modulePrices)
      .filter((entry): entry is [ModuleKey, number] => isModuleKey(entry[0]))
      // Keep the site's module order, not the API's object order.
      .sort(([a], [b]) => moduleKeys.indexOf(a) - moduleKeys.indexOf(b))
      .map(([key, price]) => ({
        key,
        label: labels.module(key),
        price: addOnPrice(formatMoney(locale, price, offer.currency)),
      })),
  };
}

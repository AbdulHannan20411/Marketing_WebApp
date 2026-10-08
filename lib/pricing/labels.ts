import "server-only";

import { getTranslations } from "next-intl/server";

import type { PricingLabels } from "./view-model";

/** Builds the translated labels the pricing view-model needs. */
export async function getPricingLabels(): Promise<PricingLabels> {
  const [t, limits, modules] = await Promise.all([
    getTranslations("pricing"),
    getTranslations("limits"),
    getTranslations("modules.labels"),
  ]);

  return {
    limits: {
      unlimited: limits("unlimited"),
      notIncluded: limits("notIncluded"),
      gb: (value) => limits("gb", { value }),
      mb: (value) => limits("mb", { value }),
      km: (value) => limits("km", { value }),
      upToKm: (value) => limits("upToKm", { value }),
    },
    module: (key) => modules(key),
    limit: (row) => t(`limits.${row}`),
    support: (level) => t(`support.${level}`),
    autoReply: (key) => t(`autoReply.${key}`),
    perMonth: t("plan.perMonth"),
    perYear: t("plan.perYear"),
    approxPerMonth: (price) => t("plan.approxPerMonth", { price }),
    save: (percent) => t("plan.save", { percent: String(percent) }),
    promo: (percent) => t("plan.promo", { percent: String(percent) }),
    trial: (days) => t("plan.trial", { days }),
    startTrial: t("plan.startTrial"),
    getStarted: t("plan.getStarted"),
    ctaLabel: (action, plan) => t("plan.ctaLabel", { action, plan }),
  };
}

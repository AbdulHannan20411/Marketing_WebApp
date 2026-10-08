import type { Locale } from "@/lib/i18n/routing";

import type { Plan } from "./schemas";

/** Pakistani number formatting for each site locale. */
export function intlLocale(locale: Locale): string {
  return locale === "ur" ? "ur-PK" : "en-PK";
}

/** "PKR 4,500": ISO code, no decimals (prices are whole major units). */
export function formatMoney(locale: Locale, amount: number, currency: string): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

/** Yearly saving as a whole percentage, or 0 when yearly is not cheaper than 12 months. */
export function yearlySavingPercent(plan: Pick<Plan, "monthlyPrice" | "yearlyPrice">): number {
  if (plan.monthlyPrice <= 0) return 0;
  const saving = 1 - plan.yearlyPrice / (plan.monthlyPrice * 12);
  return saving > 0 ? Math.round(saving * 100) : 0;
}

/**
 * A plan limit, ready to translate. `null` means unlimited.
 * The caller supplies translated words via `labels`.
 */
export type LimitLabels = {
  unlimited: string;
  notIncluded: string;
  gb: (value: string) => string;
  mb: (value: string) => string;
  km: (value: string) => string;
  upToKm: (value: string) => string;
};

/** The platform's maximum nearby-business search radius, used when the limit is null. */
export const MAX_SEARCH_RADIUS_KM = 10;

export function formatLimit(locale: Locale, value: number | null, labels: LimitLabels): string {
  return value === null ? labels.unlimited : formatNumber(locale, value);
}

export function formatStorage(locale: Locale, mb: number | null, labels: LimitLabels): string {
  if (mb === null) return labels.unlimited;
  if (mb > 0 && mb % 1024 === 0) return labels.gb(formatNumber(locale, mb / 1024));
  return labels.mb(formatNumber(locale, mb));
}

export function formatSearchRadius(locale: Locale, km: number | null, labels: LimitLabels): string {
  if (km === null) return labels.upToKm(formatNumber(locale, MAX_SEARCH_RADIUS_KM));
  if (km === 0) return labels.notIncluded;
  return labels.km(formatNumber(locale, km));
}

import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, InfoIcon, SparklesIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { fallbackPlans } from "@/content/fallback-plans";
import { isModuleKey } from "@/content/modules";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { getCustomPlanOffer, getPublicPlans } from "@/lib/nextreach-api";
import { formatMoney } from "@/lib/pricing/format";
import { appLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Section, SectionHeader } from "./section";

/**
 * Home page pricing teaser: up to three live plans (or the typed fallback when the
 * API is unavailable) plus the "Build your own plan" mention when it is offered.
 */
export async function PricingTeaser() {
  const [plansResult, customResult, locale, t, tm] = await Promise.all([
    getPublicPlans(),
    getCustomPlanOffer(),
    getLocale(),
    getTranslations("pricingTeaser"),
    getTranslations("modules.labels"),
  ]);

  // Only warn when a pricing API is set up but failing (see the Pricing page).
  const usingFallback = !plansResult.ok && plansResult.reason !== "not_configured";
  const contactPricing = `/${locale}/contact?topic=pricing`;
  const appPricingUrl = appLinks.pricing ?? contactPricing;
  const appCustomPlanUrl = appLinks.customPlan ?? contactPricing;
  const plans = (plansResult.ok ? plansResult.data : fallbackPlans).slice(0, 3);
  const custom = customResult.ok && customResult.data.enabled ? customResult.data : null;

  return (
    <Section id="pricing" tone="subtle" labelledBy="pricing-teaser-title">
      <SectionHeader
        id="pricing-teaser-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        align="split"
      >
        <Button asChild variant="outline">
          <Link href="/pricing">
            {t("seeAllPlans")}
            <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      </SectionHeader>

      {usingFallback ? (
        <p
          role="note"
          className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          <InfoIcon className="size-4 shrink-0" aria-hidden="true" />
          {t("fallbackNotice")}
          <a href={appPricingUrl} className="font-semibold underline underline-offset-4">
            {t("fallbackLink")}
          </a>
        </p>
      ) : null}

      {plans.length === 0 ? (
        <p className="mx-auto mt-10 max-w-xl text-center text-muted-foreground">
          {t("noPlans")}{" "}
          <a
            href={appPricingUrl}
            className="font-semibold text-primary underline underline-offset-4"
          >
            {t("fallbackLink")}
          </a>
        </p>
      ) : (
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => {
            const featured = plan.isMostPopular || plan.isRecommended;
            const hero = plan.isMostPopular;
            const modules = Object.entries(plan.modules)
              .filter(([key, on]) => on && isModuleKey(key))
              .map(([key]) => key)
              .filter(isModuleKey)
              .slice(0, 4);
            return (
              <Reveal as="li" key={plan.id} delay={index * 100}>
                <article
                  className={cn(
                    "relative isolate flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-7 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift",
                    hero && "border-transparent surface-ink shadow-lift",
                    featured && !hero && "border-brand/40 ring-1 ring-brand/20",
                  )}
                >
                  {hero ? (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -end-20 -top-24 -z-10 size-56 rounded-full bg-brand/25 blur-3xl"
                    />
                  ) : null}
                  <div className="mb-4 flex min-h-7 items-center">
                    {featured ? (
                      <p className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        <SparklesIcon className="size-3" aria-hidden="true" />
                        {plan.isMostPopular ? t("mostPopular") : t("recommended")}
                      </p>
                    ) : null}
                  </div>
                  {/* Plan names and taglines come from the API in English. */}
                  <h3 className="text-xl font-semibold tracking-tight" lang="en">
                    {plan.name}
                  </h3>
                  {plan.tagline ? (
                    <p className="mt-1 text-sm text-muted-foreground" lang="en">
                      {plan.tagline}
                    </p>
                  ) : null}
                  <p className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-sm text-muted-foreground">{t("from")}</span>
                    <span
                      className="text-4xl font-semibold tracking-[-0.03em] tabular-nums md:text-3xl lg:text-4xl"
                      dir="ltr"
                    >
                      {formatMoney(locale, plan.monthlyPrice, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                  </p>
                  {plan.trialDays > 0 ? (
                    <p className="mt-2 text-sm font-medium text-primary">
                      {t("trial", { days: plan.trialDays })}
                    </p>
                  ) : null}
                  <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t pt-6 text-sm">
                    {modules.map((key) => (
                      <li key={key} className="flex items-start gap-2">
                        <CheckIcon
                          className="mt-0.5 size-4 shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        {tm(key)}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </ul>
      )}

      {custom ? (
        <Reveal className="mt-5 flex flex-col items-center justify-between gap-5 rounded-2xl border bg-card p-6 text-center shadow-card sm:flex-row sm:p-7 sm:text-start">
          <div className="flex items-start gap-4">
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-accent text-accent-foreground sm:flex">
              <SparklesIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold">{t("custom.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.rich("custom.description", {
                  price: formatMoney(locale, custom.startingMonthlyPrice, custom.currency),
                  strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <a href={appCustomPlanUrl}>
              {t("custom.cta")}
              <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </Button>
        </Reveal>
      ) : null}
    </Section>
  );
}

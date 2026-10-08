import { ArrowUpRightIcon, CheckIcon, InfoIcon, SparklesIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { fallbackPlans } from "@/content/fallback-plans";
import { isModuleKey } from "@/content/modules";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { getCustomPlanOffer, getPublicPlans } from "@/lib/nextreach-api";
import { formatMoney } from "@/lib/pricing/format";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Section, SectionHeader } from "./section";

const appPricingUrl = new URL("/pricing", siteConfig.appUrl).toString();
const appCustomPlanUrl = new URL("/pricing/custom", siteConfig.appUrl).toString();

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

  const usingFallback = !plansResult.ok;
  const plans = (plansResult.ok ? plansResult.data : fallbackPlans).slice(0, 3);
  const custom = customResult.ok && customResult.data.enabled ? customResult.data : null;

  return (
    <Section id="pricing" labelledBy="pricing-teaser-title">
      <SectionHeader
        id="pricing-teaser-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {usingFallback ? (
        <p
          role="note"
          className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
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
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const featured = plan.isMostPopular || plan.isRecommended;
            const modules = Object.entries(plan.modules)
              .filter(([key, on]) => on && isModuleKey(key))
              .map(([key]) => key)
              .filter(isModuleKey)
              .slice(0, 4);
            return (
              <Reveal as="li" key={plan.id} delay={index * 100}>
                <article
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg",
                    featured && "border-brand/60 shadow-md ring-1 ring-brand/30",
                  )}
                >
                  {plan.isMostPopular || plan.isRecommended ? (
                    <p className="absolute start-6 -top-3 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      {plan.isMostPopular ? t("mostPopular") : t("recommended")}
                    </p>
                  ) : null}
                  {/* Plan names and taglines come from the API in English. */}
                  <h3 className="text-lg font-semibold" lang="en">
                    {plan.name}
                  </h3>
                  {plan.tagline ? (
                    <p className="mt-1 text-sm text-muted-foreground" lang="en">
                      {plan.tagline}
                    </p>
                  ) : null}
                  <p className="mt-5 flex flex-wrap items-baseline gap-x-1">
                    <span className="text-sm text-muted-foreground">{t("from")}</span>
                    <span className="text-3xl font-bold tracking-tight" dir="ltr">
                      {formatMoney(locale, plan.monthlyPrice, plan.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                  </p>
                  {plan.trialDays > 0 ? (
                    <p className="mt-2 text-sm font-medium text-primary">
                      {t("trial", { days: plan.trialDays })}
                    </p>
                  ) : null}
                  <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm">
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
        <Reveal className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-brand/50 bg-accent/50 p-6 text-center sm:flex-row sm:text-start">
          <div className="flex items-start gap-3">
            <SparklesIcon
              className="mt-1 hidden size-5 shrink-0 text-brand sm:block"
              aria-hidden="true"
            />
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

      <div className="mt-10 flex justify-center">
        <Button asChild size="lg" variant="outline">
          <Link href="/pricing">{t("seeAllPlans")}</Link>
        </Button>
      </div>
    </Section>
  );
}

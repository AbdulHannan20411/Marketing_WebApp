import { BanknoteIcon, InfoIcon, SmartphoneIcon, WalletIcon } from "lucide-react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getLocale, getTranslations } from "next-intl/server";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { ComparisonTable } from "@/components/pricing/comparison-table";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { JsonLd } from "@/components/seo/json-ld";
import { QueryDialogButton } from "@/features/queries/components/query-dialog-button";
import { fallbackPlans } from "@/content/fallback-plans";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getCustomPlanOffer, getPublicPlans } from "@/lib/nextreach-api";
import { getPricingLabels } from "@/lib/pricing/labels";
import {
  buildComparison,
  buildCustomPlanCard,
  buildPlanCard,
  maxYearlySaving,
} from "@/lib/pricing/view-model";
import { localizedPath, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { productJsonLd } from "@/lib/structured-data";

const appPricingUrl = new URL("/pricing", siteConfig.appUrl).toString();
const appCustomPlanUrl = new URL("/pricing/custom", siteConfig.appUrl).toString();

const pricingFaqIds = [
  "currency",
  "billing",
  "trialEnd",
  "changePlan",
  "custom",
  "approval",
  "refunds",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("pricing");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/pricing",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function PricingPage() {
  const [plansResult, customResult, localeValue, t, common, labels] = await Promise.all([
    getPublicPlans(),
    getCustomPlanOffer(),
    getLocale(),
    getTranslations("pricing"),
    getTranslations("common"),
    getPricingLabels(),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";

  const usingFallback = !plansResult.ok;
  const plans = plansResult.ok ? plansResult.data : fallbackPlans;
  const offer = customResult.ok ? customResult.data : null;

  const cards = plans.map((plan) => buildPlanCard(plan, locale, labels, appPricingUrl));
  const comparison = buildComparison(plans, locale, labels);
  const custom = offer
    ? buildCustomPlanCard(offer, locale, labels, (price) => t("custom.addOnPrice", { price }))
    : null;
  const saving = maxYearlySaving(plans);
  const strong = (chunks: React.ReactNode) => <strong className="text-foreground">{chunks}</strong>;

  return (
    <>
      <JsonLd
        data={productJsonLd({
          plans,
          name: siteConfig.name,
          description: t("productDescription"),
          pageUrl: new URL(localizedPath(locale, "/pricing"), siteConfig.url).toString(),
          offerUrl: appPricingUrl,
        })}
      />

      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <section aria-labelledby="plans-title" className="py-12 sm:py-16">
        <div className="container-page flex flex-col gap-8">
          <h2 id="plans-title" className="sr-only">
            {t("metaTitle")}
          </h2>

          {usingFallback ? (
            <p
              role="note"
              className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
            >
              <InfoIcon className="size-4 shrink-0" aria-hidden="true" />
              {t("notice.fallback")}
              <a href={appPricingUrl} className="font-semibold underline underline-offset-4">
                {t("notice.link")}
              </a>
            </p>
          ) : null}

          {cards.length === 0 ? (
            <p className="mx-auto max-w-xl rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
              {t("notice.noPlans")}{" "}
              <a
                href={appPricingUrl}
                className="font-semibold text-primary underline underline-offset-4"
              >
                {t("notice.link")}
              </a>
            </p>
          ) : (
            <PricingPlans
              plans={cards}
              custom={custom}
              customHref={appCustomPlanUrl}
              labels={{
                billing: {
                  group: t("billing.label"),
                  monthly: t("billing.monthly"),
                  yearly: t("billing.yearly"),
                  badge: saving > 0 ? t("billing.saveUpTo", { percent: String(saving) }) : null,
                },
                mostPopular: t("plan.mostPopular"),
                recommended: t("plan.recommended"),
                includes: t("plan.includes"),
                limitsTitle: t("plan.limitsTitle"),
                autoReplyTitle: t("plan.autoReplyTitle"),
                fullComparison: t("plan.fullComparison"),
                custom: {
                  eyebrow: t("custom.eyebrow"),
                  title: t("custom.title"),
                  alwaysIncluded: t("custom.alwaysIncluded"),
                  addOns: t("custom.addOns"),
                  cta: t("custom.cta"),
                  descriptionMonthly: custom
                    ? t.rich("custom.descriptionMonthly", { price: custom.monthlyPrice, strong })
                    : null,
                  descriptionYearly: custom
                    ? t.rich("custom.descriptionYearly", {
                        price: custom.yearlyPrice,
                        percent: String(custom.yearlyDiscountPercent),
                        strong,
                      })
                    : null,
                },
              }}
            />
          )}
        </div>
      </section>

      {cards.length > 0 ? (
        <Section id="compare" tone="subtle" labelledBy="compare-title">
          <SectionHeader
            id="compare-title"
            title={t("comparison.title")}
            subtitle={t("comparison.subtitle")}
          />
          <Reveal className="mt-10">
            <ComparisonTable
              data={comparison}
              labels={{
                caption: t("comparison.caption"),
                feature: t("comparison.feature"),
                included: common("included"),
                notIncluded: labels.limits.notIncluded,
                scrollHint: t("comparison.scrollHint"),
                groups: {
                  modules: t("comparison.groups.modules"),
                  limits: t("comparison.groups.limits"),
                  support: t("comparison.groups.support"),
                },
              }}
            />
          </Reveal>
        </Section>
      ) : null}

      <PaymentsSection />

      <Section tone="subtle" labelledBy="pricing-faq-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="flex flex-col items-start gap-4">
            <SectionHeader id="pricing-faq-title" title={t("faq.title")} align="start" />
            <Link
              href="/faq"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("faq.more")}
            </Link>
            <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border bg-card p-5">
              <h3 className="font-semibold">{t("talk.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("talk.body")}</p>
              <QueryDialogButton source="pricing" topic="pricing" variant="outline">
                {t("talk.button")}
              </QueryDialogButton>
            </div>
          </div>
          <Reveal>
            <FaqAccordion
              items={pricingFaqIds.map((id) => ({
                id: `pricing-${id}`,
                question: t(`faq.items.${id}.q`),
                answer: t(`faq.items.${id}.a`),
              }))}
            />
          </Reveal>
        </div>
      </Section>
    </>
  );
}

async function PaymentsSection() {
  const t = await getTranslations("pricing.payments");
  const methods = [
    { key: "jazzcash", icon: SmartphoneIcon },
    { key: "easypaisa", icon: WalletIcon },
    { key: "bank", icon: BanknoteIcon },
  ] as const;
  const steps = ["choose", "pay", "upload", "approve"] as const;

  return (
    <Section labelledBy="payments-title">
      <SectionHeader
        id="payments-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {methods.map(({ key, icon: Icon }, index) => (
          <Reveal as="li" key={key} delay={index * 100} className="rounded-2xl border bg-card p-6">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-accent-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{t(`methods.${key}.name`)}</h3>
            <p className="mt-1 text-muted-foreground">{t(`methods.${key}.description`)}</p>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mx-auto mt-12 max-w-4xl">
        <h3 className="text-center text-lg font-semibold">{t("stepsTitle")}</h3>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl border bg-card p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-sm">{t(`steps.${step}`)}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}

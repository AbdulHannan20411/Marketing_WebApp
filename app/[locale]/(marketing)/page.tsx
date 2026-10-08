import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/cta-band";
import { HomeHero } from "@/components/marketing/home/hero";
import {
  AutomationSection,
  FactsSection,
  FaqTeaserSection,
  FeatureGridSection,
  HowItWorksSection,
  ModulesSection,
  ProblemSection,
} from "@/components/marketing/home/sections";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { appLinks } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("home");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/",
    title: `${t("metaTitle")} | NextReach`,
    description: t("metaDescription"),
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const t = await getTranslations("home.finalCta");

  return (
    <>
      <HomeHero />
      {/* TODO: real customer logos — add a logo strip here once customers agree to be listed. */}
      <ProblemSection />
      <FeatureGridSection />
      <FactsSection />
      <HowItWorksSection />
      <AutomationSection />
      <ModulesSection />
      {/* TODO: real testimonial — add customer quotes here (with permission). Never invent them. */}
      <PricingTeaser />
      <FaqTeaserSection />
      <CtaBand
        title={t("title")}
        subtitle={t("subtitle")}
        primary={{ label: t("primary"), href: appLinks.startTrial }}
        secondaryDialog={{ label: t("secondary"), source: "dialog" }}
      />
    </>
  );
}

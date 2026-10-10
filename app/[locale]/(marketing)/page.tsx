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
import { JsonLd } from "@/components/seo/json-ld";
import { isLocale, localeMeta } from "@/lib/i18n/routing";
import { localizedPath, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";

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
  const [localeValue, t, meta] = await Promise.all([
    rootLocale(),
    getTranslations("home.finalCta"),
    getTranslations("metadata"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd({ siteUrl: siteConfig.url, description: meta("description") }),
          websiteJsonLd({
            siteUrl: siteConfig.url,
            pageUrl: new URL(localizedPath(locale, "/"), siteConfig.url).toString(),
            name: meta("siteName"),
            language: localeMeta[locale].htmlLang,
          }),
        ]}
      />
      <HomeHero />
      <FactsSection />
      {/* TODO: real customer logos — add a logo strip here once customers agree to be listed. */}
      <ProblemSection />
      <FeatureGridSection />
      <HowItWorksSection />
      <AutomationSection />
      <ModulesSection />
      {/* TODO: real testimonial — add customer quotes here (with permission). Never invent them. */}
      <PricingTeaser />
      <FaqTeaserSection />
      <CtaBand
        title={t("title")}
        subtitle={t("subtitle")}
        trial={{ label: t("primary") }}
        secondaryDialog={{ label: t("secondary"), source: "dialog" }}
      />
    </>
  );
}

import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { FaqExplorer } from "@/components/marketing/faq-explorer";
import { QUERY_TOKEN } from "@/components/marketing/faq-search";
import { PageHero } from "@/components/marketing/page-hero";
import { faqGroups } from "@/content/faq";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("faq");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/faq",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function FaqPage() {
  const t = await getTranslations("faq");
  const total = faqGroups.reduce((sum, group) => sum + group.items.length, 0);

  const groups = faqGroups.map((group) => ({
    id: group.id,
    title: t(`groups.${group.id}`),
    items: group.items.map((id) => ({
      id,
      question: t(`items.${id}.q`),
      answer: t(`items.${id}.a`),
    })),
  }));

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")}>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {t("subtitle")}{" "}
          <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">
            {t("askUs")}
          </Link>
        </p>
      </PageHero>
      <div className="container-page py-12 sm:py-16">
        <FaqExplorer
          groups={groups}
          labels={{
            search: t("searchLabel"),
            placeholder: t("searchPlaceholder"),
            clear: t("clear"),
            resultsByCount: Array.from({ length: total + 1 }, (_, count) =>
              t("results", { count }),
            ),
            noResults: t("noResults", { query: QUERY_TOKEN }),
            noResultsHint: t("noResultsHint"),
            askUs: t("askUs"),
          }}
        />
      </div>
    </>
  );
}

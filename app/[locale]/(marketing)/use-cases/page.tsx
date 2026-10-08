import { CircleAlertIcon, CircleCheckIcon, LightbulbIcon } from "lucide-react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/cta-band";
import { moduleIcons } from "@/components/marketing/module-icons";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { anchorForUseCase, useCases } from "@/content/use-cases";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("useCases");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/use-cases",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function UseCasesPage() {
  const [t, ti, tm] = await Promise.all([
    getTranslations("useCases"),
    getTranslations("useCases.industries"),
    getTranslations("modules.labels"),
  ]);
  // Keys come from the typed content source; a unit test checks they all exist.
  const tk = ti as unknown as (key: string) => string;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
        <nav aria-label={t("jumpTo")} className="mt-4">
          <ul className="flex flex-wrap justify-center gap-2">
            {useCases.map((useCase) => (
              <li key={useCase.id}>
                <a
                  href={`#${anchorForUseCase(useCase.id)}`}
                  className="inline-flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium transition-colors hover:border-brand/50 hover:bg-accent"
                >
                  <useCase.icon className="size-4 text-brand" aria-hidden="true" />
                  {ti(`${useCase.id}.name`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      {useCases.map((useCase, index) => (
        <section
          key={useCase.id}
          id={anchorForUseCase(useCase.id)}
          aria-labelledby={`${useCase.id}-title`}
          className={cn("scroll-mt-20 py-16 sm:py-20", index % 2 === 1 && "bg-surface-subtle")}
        >
          <div className="container-page">
            <Reveal className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-accent-foreground">
                <useCase.icon className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id={`${useCase.id}-title`}
                  className="text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  {ti(`${useCase.id}.name`)}
                </h2>
                <p className="text-muted-foreground">{ti(`${useCase.id}.summary`)}</p>
              </div>
            </Reveal>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <Reveal className="rounded-2xl border bg-card p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <CircleAlertIcon className="size-5 text-warning" aria-hidden="true" />
                  {t("challengesTitle")}
                </h3>
                <ul className="mt-4 flex list-disc flex-col gap-3 ps-5 text-muted-foreground marker:text-muted-foreground/60">
                  {useCase.challenges.map((key) => (
                    <li key={key}>{tk(`${useCase.id}.challenges.${key}`)}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={100} className="rounded-2xl border border-brand/40 bg-card p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <CircleCheckIcon className="size-5 text-brand" aria-hidden="true" />
                  {t("solutionsTitle")}
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {useCase.solutions.map((key) => (
                    <li key={key} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                      />
                      {tk(`${useCase.id}.solutions.${key}`)}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={200} className="flex flex-col gap-6">
                <div className="rounded-2xl bg-accent p-6 text-accent-foreground">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <LightbulbIcon className="size-5" aria-hidden="true" />
                    {t("exampleTitle")}
                  </h3>
                  <p className="mt-3 leading-relaxed">{ti(`${useCase.id}.example`)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {t("modulesTitle")}
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {useCase.modules.map((key) => {
                      const Icon = moduleIcons[key];
                      return (
                        <li
                          key={key}
                          className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm"
                        >
                          <Icon className="size-3.5 text-brand" aria-hidden="true" />
                          {tm(key)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <CtaBand
        title={t("cta.title")}
        subtitle={t("cta.subtitle")}
        secondary={{ label: t("cta.button"), href: "/contact" }}
      />
    </>
  );
}

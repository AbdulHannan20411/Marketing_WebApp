import { ArrowRightIcon, CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/cta-band";
import { Mockup } from "@/components/marketing/mockups/mockups";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { featureAreas } from "@/content/features";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { appLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("features");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/features",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function FeaturesPage() {
  const [t, tf, tp, cta] = await Promise.all([
    getTranslations("features"),
    getTranslations("features.areas"),
    getTranslations("featurePages.pages"),
    getTranslations("home.finalCta"),
  ]);

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <nav
        aria-label={t("jumpTo")}
        className="sticky top-16 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
      >
        <ul className="container-page flex [scrollbar-width:none] gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden">
          {featureAreas.map((area) => (
            <li key={area.id} className="shrink-0">
              <a
                href={`#${area.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-sm font-medium transition-colors hover:border-brand/50 hover:bg-accent"
              >
                <area.icon className="size-4 text-brand" aria-hidden="true" />
                {tf(`${area.id}.nav`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {featureAreas.map((area, index) => {
        const reversed = index % 2 === 1;
        const points = area.points as readonly string[];
        return (
          <section
            key={area.id}
            id={area.id}
            aria-labelledby={`${area.id}-title`}
            className={cn("scroll-mt-32 py-16 sm:py-20", reversed && "bg-surface-subtle")}
          >
            <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal className={cn("flex flex-col items-start gap-5", reversed && "lg:order-2")}>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-accent-foreground">
                    <area.icon className="size-4" aria-hidden="true" />
                  </span>
                  {tf(`${area.id}.title`)}
                </p>
                <h2
                  id={`${area.id}-title`}
                  className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
                >
                  {tf(`${area.id}.headline`)}
                </h2>
                <p className="text-lg text-muted-foreground">{tf(`${area.id}.summary`)}</p>
                <ul className="flex flex-col gap-3">
                  {points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <CheckIcon className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
                      {/* Keys come from the typed content source and exist in both catalogues. */}
                      <span>{tf(`${area.id}.points.${point}` as Parameters<typeof tf>[0])}</span>
                    </li>
                  ))}
                </ul>
                {"slug" in area ? (
                  <Link
                    href={`/features/${area.slug}`}
                    className="group inline-flex items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {t("detailLink", { name: tp(`${area.slug}.name`) })}
                    <ArrowRightIcon
                      className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                ) : null}
              </Reveal>
              <Reveal delay={120} className={cn(reversed && "lg:order-1")}>
                <Mockup id={area.mockup} />
              </Reveal>
            </div>
          </section>
        );
      })}

      <CtaBand
        title={cta("title")}
        subtitle={cta("subtitle")}
        primary={{ label: cta("primary"), href: appLinks.startTrial }}
        secondaryDialog={{ label: cta("secondary"), source: "dialog" }}
      />
    </>
  );
}

import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/cta-band";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Mockup } from "@/components/marketing/mockups/mockups";
import { Eyebrow, Section, SectionHeader } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { featurePages, featureSlugs, isFeatureSlug, type FeatureSlug } from "@/content/features";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { appLinks } from "@/lib/site";

export function generateStaticParams() {
  return featureSlugs.map((slug) => ({ slug }));
}

type Props = PageProps<"/[locale]/features/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, rootLocale()]);
  if (!isFeatureSlug(slug)) return {};
  const t = await getTranslations(`featurePages.pages.${slug}`);
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: `/features/${slug}`,
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function FeatureDetailPage({ params }: Props) {
  const { slug } = await params;
  if (!isFeatureSlug(slug)) notFound();
  return <FeatureDetail slug={slug} />;
}

async function FeatureDetail({ slug }: { slug: FeatureSlug }) {
  const page = featurePages[slug];
  const [t, shared, tPages, nav, cta] = await Promise.all([
    getTranslations(`featurePages.pages.${slug}`),
    getTranslations("featurePages.shared"),
    getTranslations("featurePages.pages"),
    getTranslations("nav"),
    getTranslations("home.finalCta"),
  ]);
  // Keys below come from the typed content source; a unit test checks they all exist.
  const tk = t as unknown as (key: string) => string;

  return (
    <>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <nav aria-label={shared("breadcrumb")}>
              <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground hover:underline">
                    {nav("features")}
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRightIcon className="size-3.5 rtl:rotate-180" />
                </li>
                <li aria-current="page" className="font-medium text-foreground">
                  {t("name")}
                </li>
              </ol>
            </nav>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("title")}
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">{t("subtitle")}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <a href={appLinks.startTrial}>
                  {cta("primary")}
                  <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">{cta("secondary")}</Link>
              </Button>
            </div>
          </div>
          <Mockup id={page.mockup} />
        </div>
      </section>

      <Section labelledBy="benefits-title">
        <SectionHeader id="benefits-title" title={shared("benefitsTitle")} />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {page.benefits.map((key, index) => (
            <Reveal as="li" key={key} delay={index * 80} className="rounded-2xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-accent-foreground">
                <page.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{tk(`benefits.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {tk(`benefits.${key}.description`)}
              </p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section tone="subtle" labelledBy="steps-title">
        <SectionHeader id="steps-title" title={shared("stepsTitle")} />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {page.steps.map((key, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 120}
              className="rounded-2xl border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{tk(`steps.${key}.title`)}</h3>
              <p className="mt-2 text-muted-foreground">{tk(`steps.${key}.description`)}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section labelledBy="capabilities-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <SectionHeader
            id="capabilities-title"
            title={shared("capabilitiesTitle")}
            align="start"
          />
          <Reveal as="ul" className="grid gap-3 sm:grid-cols-2">
            {page.capabilities.map((key) => (
              <li key={key} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <CheckIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                <span className="font-medium">{tk(`capabilities.${key}`)}</span>
              </li>
            ))}
          </Reveal>
        </div>
      </Section>

      <Section tone="subtle" labelledBy="faq-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <SectionHeader id="faq-title" title={shared("faqTitle")} align="start" />
          <Reveal>
            <FaqAccordion
              items={page.faqs.map((key) => ({
                id: `${slug}-${key}`,
                question: tk(`faqs.${key}.q`),
                answer: tk(`faqs.${key}.a`),
              }))}
            />
          </Reveal>
        </div>
      </Section>

      <Section labelledBy="related-title">
        <SectionHeader id="related-title" title={shared("relatedTitle")} />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {page.related.map((related) => {
            const relatedPage = featurePages[related];
            return (
              <li key={related}>
                <Link
                  href={`/features/${related}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border bg-card p-5 transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-md"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-accent-foreground">
                    <relatedPage.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 font-semibold">{tPages(`${related}.name`)}</span>
                  <ArrowRightIcon
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="ghost">
            <Link href="/features">{shared("allFeatures")}</Link>
          </Button>
        </div>
      </Section>

      <CtaBand
        title={cta("title")}
        subtitle={cta("subtitle")}
        primary={{ label: cta("primary"), href: appLinks.startTrial }}
        secondary={{ label: cta("secondary"), href: "/contact" }}
      />
    </>
  );
}

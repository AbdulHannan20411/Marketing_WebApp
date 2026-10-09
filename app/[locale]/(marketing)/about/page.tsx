import {
  ArrowRightIcon,
  BadgeCheckIcon,
  HeartHandshakeIcon,
  MapPinnedIcon,
  PuzzleIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("about");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/about",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const principles = [
    { key: "official", icon: BadgeCheckIcon },
    { key: "plain", icon: PuzzleIcon },
    { key: "local", icon: MapPinnedIcon },
    { key: "fair", icon: HeartHandshakeIcon },
  ] as const;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <Section labelledBy="story-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <h2
              id="story-title"
              className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-display"
            >
              {t("story.title")}
            </h2>
          </Reveal>
          <Reveal
            delay={100}
            className="flex flex-col gap-6 border-s-2 border-brand/40 ps-6 text-lg leading-relaxed text-muted-foreground sm:ps-8"
          >
            <p className="text-xl text-foreground">{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
          </Reveal>
        </div>
      </Section>

      <Section tone="subtle" labelledBy="principles-title">
        <SectionHeader id="principles-title" title={t("principles.title")} align="start" />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {principles.map(({ key, icon: Icon }, index) => (
            <Reveal as="li" key={key} delay={index * 80} className="flex flex-col bg-card p-7">
              <span className="flex size-10 items-center justify-center rounded-xl border border-brand/20 bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                {t(`principles.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`principles.${key}.description`)}
              </p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section labelledBy="audience-title">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-8 shadow-card sm:p-10">
            <h2 id="audience-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("audience.title")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("audience.description")}</p>
            <Button asChild variant="outline">
              <Link href="/use-cases">
                {t("audience.cta")}
                <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
          <Reveal
            delay={120}
            className="relative isolate flex flex-col gap-4 overflow-hidden rounded-2xl surface-ink p-8 shadow-lift sm:p-10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 -bottom-24 -z-10 size-64 rounded-full bg-brand/20 blur-3xl"
            />
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("team.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("team.description")}</p>
            {/* TODO: real team — add team members (photo, name, role) once ready. Never use stock or invented people. */}
          </Reveal>
        </div>
      </Section>

      <CtaBand
        title={t("cta.title")}
        subtitle={t("cta.subtitle")}
        secondaryDialog={{ label: t("cta.button"), source: "dialog" }}
      />
    </>
  );
}

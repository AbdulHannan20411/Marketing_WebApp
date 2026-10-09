import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  MoonIcon,
  OctagonPauseIcon,
  PlugZapIcon,
  SendIcon,
  ShieldIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Mockup } from "@/components/marketing/mockups/mockups";
import { moduleIcons } from "@/components/marketing/module-icons";
import { Section, SectionHeader } from "@/components/marketing/section";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { homeFaqIds } from "@/content/faq";
import { featureAreas, productFacts } from "@/content/features";
import { moduleKeys } from "@/content/modules";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { AutomationFlow } from "./automation-flow";
import { ModuleCarousel } from "./module-carousel";

export async function ProblemSection() {
  const t = await getTranslations("home.problem");
  const points = ["p1", "p2", "p3", "p4"] as const;

  return (
    <Section labelledBy="problem-title">
      <SectionHeader id="problem-title" eyebrow={t("eyebrow")} title={t("title")} align="split" />
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal className="rounded-2xl border bg-card p-7 shadow-card sm:p-9">
          <h3 className="flex items-center gap-3 text-lg font-semibold text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <XIcon className="size-4" aria-hidden="true" />
            </span>
            {t("beforeTitle")}
          </h3>
          <ul className="mt-6 flex flex-col divide-y">
            {points.map((point) => (
              <li key={point} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <XIcon
                  className="mt-1 size-4 shrink-0 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{t(`before.${point}`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal
          delay={120}
          className="relative isolate overflow-hidden rounded-2xl surface-ink p-7 shadow-lift sm:p-9"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 -top-32 -z-10 size-72 rounded-full bg-brand/15 blur-3xl"
          />
          <h3 className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-primary-foreground">
              <CheckIcon className="size-4" aria-hidden="true" />
            </span>
            {t("afterTitle")}
          </h3>
          <ul className="mt-6 flex flex-col divide-y">
            {points.map((point) => (
              <li key={point} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{t(`after.${point}`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

/** Bento order: two showcase tiles, six compact ones, two showcase tiles. */
const bentoOrder = [
  "whatsapp",
  "inbox",
  "crm",
  "catalog",
  "leads",
  "leadScoring",
  "reporting",
  "employees",
  "aiAssistant",
  "automations",
] as const;
const showcase = new Set<string>(["whatsapp", "inbox", "aiAssistant", "automations"]);

export async function FeatureGridSection() {
  const [t, ta, tc] = await Promise.all([
    getTranslations("home.features"),
    getTranslations("features.areas"),
    getTranslations("common"),
  ]);
  const areas = bentoOrder
    .map((id) => featureAreas.find((area) => area.id === id))
    .filter((area): area is (typeof featureAreas)[number] => Boolean(area));

  return (
    <Section tone="subtle" labelledBy="features-title">
      <SectionHeader
        id="features-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        align="split"
      >
        <Button asChild variant="outline">
          <Link href="/features">
            {t("cta")}
            <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      </SectionHeader>
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {areas.map((area, index) => {
          const big = showcase.has(area.id);
          const href =
            "slug" in area && area.slug ? `/features/${area.slug}` : `/features#${area.id}`;
          return (
            <Reveal
              as="li"
              key={area.id}
              delay={(index % 3) * 70}
              className={cn(big ? "sm:col-span-2 lg:col-span-3" : "lg:col-span-2")}
            >
              <Link
                href={href}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lift"
              >
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-brand/20 bg-accent text-accent-foreground">
                      <area.icon className="size-5" aria-hidden="true" />
                    </span>
                    <ArrowUpRightIcon
                      className="size-4 text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100 rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className={cn("font-semibold", big ? "text-xl" : "text-base")}>
                    {ta(`${area.id}.title`)}
                  </h3>
                  <p className="text-sm text-pretty text-muted-foreground">
                    {ta(`${area.id}.summary`)}
                  </p>
                  <span className="sr-only">{tc("learnMore")}</span>
                </div>
                {big ? (
                  <div
                    aria-hidden="true"
                    className="relative mt-auto h-56 overflow-hidden border-t bg-surface-subtle mask-fade-b px-6 pt-6"
                  >
                    <div className="pointer-events-none mx-auto max-w-sm origin-top transition-transform duration-500 group-hover:scale-[1.02]">
                      <Mockup id={area.mockup} />
                    </div>
                  </div>
                ) : null}
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}

export async function FactsSection() {
  const t = await getTranslations("home.facts");
  const facts = [
    { key: "modules", value: productFacts.modules },
    { key: "recipes", value: productFacts.automationRecipes },
    { key: "payments", value: productFacts.paymentMethods },
    { key: "languages", value: productFacts.languages },
  ] as const;

  return (
    <section aria-labelledby="facts-title" className="border-b bg-card">
      <div className="container-page">
        <h2 id="facts-title" className="sr-only">
          {t("title")}
        </h2>
        <dl className="grid grid-cols-2 gap-px border-x bg-border md:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.key} className="flex flex-col-reverse gap-1.5 bg-card px-5 py-7 sm:px-8">
              <dt className="text-sm text-muted-foreground">{t(fact.key)}</dt>
              <dd className="text-4xl font-semibold tracking-tight tabular-nums">
                <AnimatedNumber value={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export async function HowItWorksSection() {
  const t = await getTranslations("home.steps");
  const steps = [
    { key: "connect", icon: PlugZapIcon },
    { key: "contacts", icon: UsersRoundIcon },
    { key: "sell", icon: SendIcon },
  ] as const;

  return (
    <Section id="how-it-works" labelledBy="how-title">
      <SectionHeader id="how-title" eyebrow={t("eyebrow")} title={t("title")} align="start" />
      <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
        {steps.map(({ key, icon: Icon }, index) => (
          <Reveal
            as="li"
            key={key}
            delay={index * 120}
            className="relative flex flex-col gap-5 rounded-2xl border bg-card p-7 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(21_128_61/0.6)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span
                aria-hidden="true"
                data-step={`0${index + 1}`}
                className="font-mono text-4xl font-medium tracking-tight text-foreground/10 before:content-[attr(data-step)]"
              />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-balance">
              {t(`items.${key}.title`)}
            </h3>
            <p className="text-pretty text-muted-foreground">{t(`items.${key}.description`)}</p>
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute -end-3 top-12 z-10 hidden size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-card md:flex"
              >
                <ArrowRightIcon className="size-3 rtl:rotate-180" />
              </span>
            ) : null}
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

export async function AutomationSection() {
  const t = await getTranslations("home.automation");
  const guards = [
    { key: "quiet", icon: MoonIcon },
    { key: "cap", icon: ShieldIcon },
    { key: "stop", icon: OctagonPauseIcon },
  ] as const;

  return (
    <Section tone="ink" labelledBy="automation-title">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 top-10 -z-10 size-[32rem] rounded-full bg-brand/20 blur-3xl"
      />
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <SectionHeader
            id="automation-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
            align="start"
          />
          <ul className="flex flex-wrap gap-2">
            {guards.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium"
              >
                <Icon className="size-4 text-brand" aria-hidden="true" />
                {t(`guards.${key}`)}
              </li>
            ))}
          </ul>
          <Button asChild variant="inverse">
            <Link href="/features/automations">
              {t("cta")}
              <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <AutomationFlow
          strings={{
            label: t("flowLabel"),
            nodes: {
              trigger: t("nodes.trigger"),
              wait: t("nodes.wait"),
              send: t("nodes.send"),
              check: t("nodes.check"),
              yes: t("nodes.yes"),
              no: t("nodes.no"),
            },
            kinds: {
              trigger: t("kinds.trigger"),
              wait: t("kinds.wait"),
              send: t("kinds.send"),
              check: t("kinds.check"),
            },
          }}
        />
      </div>
    </Section>
  );
}

export async function ModulesSection() {
  const [t, tl, td, tc] = await Promise.all([
    getTranslations("home.modules"),
    getTranslations("modules.labels"),
    getTranslations("modules.descriptions"),
    getTranslations("common"),
  ]);
  const total = String(moduleKeys.length);

  return (
    <Section labelledBy="modules-title">
      <SectionHeader
        id="modules-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        className="mb-12"
      />
      <ModuleCarousel
        slides={moduleKeys.map((key) => {
          const Icon = moduleIcons[key];
          return {
            key,
            title: tl(key),
            description: td(key),
            icon: <Icon className="size-5" aria-hidden="true" />,
          };
        })}
        labels={{
          region: t("title"),
          previous: tc("previous"),
          next: tc("next"),
          slide: tc("slide"),
          positions: moduleKeys.map((_, index) =>
            tc("slideOf", { current: String(index + 1), total }),
          ),
        }}
      />
    </Section>
  );
}

export async function FaqTeaserSection() {
  const [t, tf] = await Promise.all([getTranslations("home.faq"), getTranslations("faq.items")]);

  return (
    <Section tone="subtle" labelledBy="faq-teaser-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col items-start gap-6">
          <SectionHeader
            id="faq-teaser-title"
            eyebrow={t("eyebrow")}
            title={t("title")}
            align="start"
          />
          <Button asChild variant="outline">
            <Link href="/faq">
              {t("cta")}
              <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <Reveal>
          <FaqAccordion
            items={homeFaqIds.map((id) => ({
              id,
              question: tf(`${id}.q`),
              answer: tf(`${id}.a`),
            }))}
          />
        </Reveal>
      </div>
    </Section>
  );
}

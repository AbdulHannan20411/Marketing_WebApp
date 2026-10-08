import {
  ArrowRightIcon,
  CheckIcon,
  MoonIcon,
  OctagonPauseIcon,
  ShieldIcon,
  XIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { moduleIcons } from "@/components/marketing/module-icons";
import { Section, SectionHeader } from "@/components/marketing/section";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { homeFaqIds } from "@/content/faq";
import { featureAreas, productFacts } from "@/content/features";
import { moduleKeys } from "@/content/modules";
import { Link } from "@/lib/i18n/navigation";

import { AutomationFlow } from "./automation-flow";
import { ModuleCarousel } from "./module-carousel";

export async function ProblemSection() {
  const t = await getTranslations("home.problem");
  const points = ["p1", "p2", "p3", "p4"] as const;

  return (
    <Section tone="subtle" labelledBy="problem-title">
      <SectionHeader id="problem-title" eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal className="rounded-2xl border bg-card p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-muted-foreground">{t("beforeTitle")}</h3>
          <ul className="mt-5 flex flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  <XIcon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground">{t(`before.${point}`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal
          delay={120}
          className="rounded-2xl border border-brand/40 bg-card p-6 shadow-lg shadow-brand/5 sm:p-8"
        >
          <h3 className="text-lg font-semibold text-primary">{t("afterTitle")}</h3>
          <ul className="mt-5 flex flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-accent-foreground">
                  <CheckIcon className="size-3.5" aria-hidden="true" />
                </span>
                <span>{t(`after.${point}`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

export async function FeatureGridSection() {
  const [t, ta] = await Promise.all([
    getTranslations("home.features"),
    getTranslations("features.areas"),
  ]);

  return (
    <Section labelledBy="features-title">
      <SectionHeader
        id="features-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featureAreas.map((area, index) => (
          <Reveal as="li" key={area.id} delay={(index % 5) * 60}>
            <Link
              href={`/features#${area.id}`}
              className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-accent-foreground transition-transform duration-300 group-hover:scale-110">
                <area.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-semibold">{ta(`${area.id}.title`)}</span>
              <span className="text-sm text-muted-foreground">{ta(`${area.id}.summary`)}</span>
            </Link>
          </Reveal>
        ))}
      </ul>
      <div className="mt-10 flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/features">
            {t("cta")}
            <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </Button>
      </div>
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
    <section aria-labelledby="facts-title" className="border-y bg-surface-subtle">
      <div className="container-page py-10">
        <h2 id="facts-title" className="sr-only">
          {t("title")}
        </h2>
        <dl className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.key} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-muted-foreground">{t(fact.key)}</dt>
              <dd className="text-4xl font-bold tracking-tight text-primary">
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
  const steps = ["connect", "contacts", "sell"] as const;

  return (
    <Section id="how-it-works" labelledBy="how-title">
      <SectionHeader id="how-title" eyebrow={t("eyebrow")} title={t("title")} />
      <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-[16%] top-6 hidden h-px bg-gradient-to-r from-brand/0 via-brand/50 to-brand/0 md:block"
        />
        {steps.map((step, index) => (
          <Reveal
            as="li"
            key={step}
            delay={index * 150}
            className="relative flex flex-col items-center gap-4 text-center"
          >
            <span className="relative flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg ring-8 shadow-brand/20 ring-background">
              {index + 1}
            </span>
            <h3 className="text-xl font-semibold">{t(`items.${step}.title`)}</h3>
            <p className="max-w-xs text-muted-foreground">{t(`items.${step}.description`)}</p>
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
    <Section tone="subtle" labelledBy="automation-title">
      <div className="grid items-center gap-12 lg:grid-cols-2">
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
                className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium"
              >
                <Icon className="size-4 text-brand" aria-hidden="true" />
                {t(`guards.${key}`)}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline">
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

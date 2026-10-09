"use client";

import { ArrowUpRightIcon, CheckIcon, SparklesIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { CustomPlanCard, PlanCard } from "@/lib/pricing/view-model";
import { cn } from "@/lib/utils";

import { BillingToggle, type BillingPeriod } from "./billing-toggle";

export type PricingPlansLabels = {
  billing: { group: string; monthly: string; yearly: string; badge: string | null };
  mostPopular: string;
  recommended: string;
  includes: string;
  limitsTitle: string;
  autoReplyTitle: string;
  fullComparison: string;
  custom: {
    eyebrow: string;
    title: string;
    alwaysIncluded: string;
    addOns: string;
    cta: string;
    /** Pre-rendered on the server (they contain <strong>). */
    descriptionMonthly: ReactNode;
    descriptionYearly: ReactNode;
  };
};

type PricingPlansProps = {
  plans: PlanCard[];
  custom: CustomPlanCard | null;
  customHref: string;
  labels: PricingPlansLabels;
};

const swap = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

/**
 * Plan cards with the monthly/yearly toggle. Receives both prices for every plan as
 * props and never refetches; the toggle only changes which value is shown.
 */
export function PricingPlans({ plans, custom, customHref, labels }: PricingPlansProps) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const gridCols =
    plans.length >= 4
      ? "lg:grid-cols-2 xl:grid-cols-4"
      : plans.length === 3
        ? "lg:grid-cols-3"
        : "md:grid-cols-2";

  return (
    <div className="flex flex-col gap-10">
      <BillingToggle value={period} onChange={setPeriod} labels={labels.billing} />

      <ul
        className={cn(
          "mx-auto grid w-full items-stretch gap-5",
          gridCols,
          plans.length < 3 && "max-w-4xl",
        )}
      >
        {plans.map((plan) => {
          const featured = plan.badge !== null;
          // The most popular plan is the statement card (deep "ink" surface).
          const hero = plan.badge === "mostPopular";
          const price = period === "monthly" ? plan.monthly : plan.yearly;
          return (
            <li key={plan.id}>
              <article
                aria-labelledby={`plan-${plan.id}`}
                className={cn(
                  "relative isolate flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-7 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lift",
                  hero && "border-transparent surface-ink shadow-lift",
                  featured && !hero && "border-brand/40 ring-1 ring-brand/20",
                )}
              >
                {hero ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -end-24 -top-28 -z-10 size-64 rounded-full bg-brand/25 blur-3xl"
                  />
                ) : null}
                <div className="flex min-h-7 flex-wrap items-center gap-2">
                  {plan.badge ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <SparklesIcon className="size-3" aria-hidden="true" />
                      {plan.badge === "mostPopular" ? labels.mostPopular : labels.recommended}
                    </span>
                  ) : null}
                  {plan.promo ? (
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      {plan.promo}
                    </span>
                  ) : null}
                </div>

                {/* Plan names, taglines and highlights come from the API in English. */}
                <h3
                  id={`plan-${plan.id}`}
                  lang="en"
                  className="mt-4 text-xl font-semibold tracking-tight"
                >
                  {plan.name}
                </h3>
                {plan.tagline ? (
                  <p lang="en" className="mt-1 text-sm text-muted-foreground">
                    {plan.tagline}
                  </p>
                ) : null}

                <div className="mt-6 min-h-20">
                  <AnimatePresence mode="wait" initial={false}>
                    <m.div key={period} {...swap}>
                      <p className="flex flex-wrap items-baseline gap-x-1">
                        <span
                          className="text-4xl font-semibold tracking-[-0.03em] tabular-nums sm:text-[2.75rem]"
                          dir="ltr"
                        >
                          {price.price}
                        </span>
                        <span className="text-sm text-muted-foreground">{price.period}</span>
                      </p>
                      {period === "yearly" ? (
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{plan.yearly.perMonth}</span>
                          {plan.yearly.saving ? (
                            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                              {plan.yearly.saving}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </m.div>
                  </AnimatePresence>
                </div>

                {plan.trial ? (
                  <p className="text-sm font-medium text-primary">{plan.trial}</p>
                ) : null}

                <Button
                  asChild
                  size="lg"
                  variant={featured ? "default" : "outline"}
                  className="mt-5 w-full"
                >
                  <a href={plan.cta.href} aria-label={plan.cta.ariaLabel}>
                    {plan.cta.label}
                    <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                  </a>
                </Button>

                <div className="mt-7 flex flex-1 flex-col gap-6 border-t pt-6 text-sm">
                  {plan.highlights.length > 0 ? (
                    <ul lang="en" className="flex flex-col gap-2 font-medium">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                          <SparklesIcon
                            className="mt-0.5 size-4 shrink-0 text-brand"
                            aria-hidden="true"
                          />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div>
                    <h4 className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {labels.includes}
                    </h4>
                    <ul className="mt-2 flex flex-col gap-2">
                      {plan.modules.map((module) => (
                        <li key={module} className="flex items-start gap-2">
                          <CheckIcon
                            className="mt-0.5 size-4 shrink-0 text-brand"
                            aria-hidden="true"
                          />
                          {module}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.autoReplies.length > 0 ? (
                    <div>
                      <h4 className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {labels.autoReplyTitle}
                      </h4>
                      <ul className="mt-2 flex flex-col gap-2">
                        {plan.autoReplies.map((reply) => (
                          <li key={reply} className="flex items-start gap-2">
                            <CheckIcon
                              className="mt-0.5 size-4 shrink-0 text-brand"
                              aria-hidden="true"
                            />
                            {reply}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div>
                    <h4 className="font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {labels.limitsTitle}
                    </h4>
                    <dl className="mt-2 flex flex-col">
                      {plan.limits.map((limit) => (
                        <div
                          key={limit.label}
                          className="flex justify-between gap-3 border-b border-dashed py-1.5 last:border-b-0"
                        >
                          <dt className="text-muted-foreground">{limit.label}</dt>
                          <dd className="font-medium tabular-nums">{limit.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <p className="mt-auto text-muted-foreground">{plan.support}</p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <p className="text-center">
        <a
          href="#compare"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {labels.fullComparison}
        </a>
      </p>

      {custom ? (
        <section
          aria-labelledby="custom-plan-title"
          className="relative isolate mx-auto grid w-full gap-10 overflow-hidden rounded-2xl border bg-card p-7 shadow-card sm:p-10 lg:grid-cols-[1.1fr_1fr]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-dots mask-fade text-foreground opacity-40"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0"
          />
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.16em] text-primary uppercase">
              <span aria-hidden="true" className="h-px w-6 bg-brand" />
              {labels.custom.eyebrow}
            </span>
            <h3 id="custom-plan-title" className="text-3xl font-semibold tracking-tight">
              {labels.custom.title}
            </h3>
            <AnimatePresence mode="wait" initial={false}>
              <m.p key={period} {...swap} className="text-lg text-muted-foreground">
                {period === "monthly"
                  ? labels.custom.descriptionMonthly
                  : labels.custom.descriptionYearly}
              </m.p>
            </AnimatePresence>
            {custom.trial ? (
              <p className="text-sm font-medium text-primary">{custom.trial}</p>
            ) : null}
            <Button asChild size="lg" className="mt-2">
              <a href={customHref}>
                {labels.custom.cta}
                <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
          </div>
          <div className="grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-1">
            {custom.alwaysIncluded.length > 0 ? (
              <div>
                <h4 className="font-semibold">{labels.custom.alwaysIncluded}</h4>
                <ul className="mt-2 flex flex-col gap-2">
                  {custom.alwaysIncluded.map((module) => (
                    <li key={module} className="flex items-center gap-2">
                      <CheckIcon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                      {module}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {custom.addOns.length > 0 ? (
              <div>
                <h4 className="font-semibold">{labels.custom.addOns}</h4>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {custom.addOns.map((addOn) => (
                    <li
                      key={addOn.key}
                      className="flex justify-between gap-3 rounded-lg border bg-background px-3.5 py-2.5"
                    >
                      <span>{addOn.label}</span>
                      <span className="font-medium whitespace-nowrap">{addOn.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

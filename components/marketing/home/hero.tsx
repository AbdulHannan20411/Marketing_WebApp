import { ArrowUpRightIcon, BadgeCheckIcon, GiftIcon, WalletIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { appLinks } from "@/lib/site";

import { HeroMockupLoader } from "./hero-mockup-loader";

export async function HomeHero() {
  const [t, chat, campaign] = await Promise.all([
    getTranslations("home.hero"),
    getTranslations("mockups.chat"),
    getTranslations("mockups.campaign"),
  ]);

  const assurances = [
    { key: "official", icon: BadgeCheckIcon },
    { key: "payments", icon: WalletIcon },
    { key: "trial", icon: GiftIcon },
  ] as const;

  return (
    <section className="relative isolate overflow-hidden border-b">
      {/* Background: a quiet grid fading out, and two soft brand glows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade text-foreground opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 -top-40 -z-10 size-[40rem] rounded-full bg-brand/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-48 top-1/3 -z-10 size-[28rem] rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20"
      />
      <div className="container-page grid items-center gap-14 pt-12 pb-16 sm:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-8 lg:pt-20 lg:pb-20">
        <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-start">
          <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-3xl border bg-card/80 py-1 ps-1.5 pe-3.5 text-sm font-medium shadow-card backdrop-blur sm:rounded-full">
            <span className="flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 font-mono text-[0.6875rem] tracking-wider whitespace-nowrap text-accent-foreground uppercase">
              <span aria-hidden="true" className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
              </span>
              {t("badge")}
            </span>
            {t("eyebrow")}
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-hero">
            {t.rich("title", {
              hl: (chunks) => (
                <span className="relative inline-block text-primary">
                  {chunks}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 14"
                    preserveAspectRatio="none"
                    className="absolute inset-x-0 -bottom-1.5 h-3 w-full text-brand/45"
                  >
                    <path
                      d="M2 10C70 4 150 2 298 8"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              ),
            })}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <a href={appLinks.startTrial}>
                {t("primaryCta")}
                <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full px-7 text-base"
            >
              <a href="#how-it-works">{t("secondaryCta")}</a>
            </Button>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-sm text-muted-foreground lg:justify-start">
            {assurances.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-2">
                <Icon className="size-4 text-brand" aria-hidden="true" />
                {t(`assurances.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <HeroMockupLoader
          label={t("mockupLabel")}
          strings={{
            business: chat("business"),
            status: chat("status"),
            today: chat("today"),
            customer1: chat("customer1"),
            reply: chat("reply"),
            catalogTitle: chat("catalogTitle"),
            catalogSubtitle: chat("catalogSubtitle"),
            catalogButton: chat("catalogButton"),
            customer2: chat("customer2"),
            typing: chat("typing"),
            composer: chat("composer"),
            leadMoved: chat("leadMoved"),
            campaignTitle: campaign("title"),
            campaignSchedule: campaign("schedule"),
            sent: campaign("sent"),
            delivered: campaign("delivered"),
            read: campaign("read"),
            quality: campaign("quality"),
          }}
        />
      </div>
    </section>
  );
}

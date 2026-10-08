import { ArrowUpRightIcon, BadgeCheckIcon, GiftIcon, WalletIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Eyebrow } from "@/components/marketing/section";
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
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-brand-soft),transparent)] opacity-70"
      />
      <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-24">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-start">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <a href={appLinks.startTrial}>
                {t("primaryCta")}
                <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <a href="#how-it-works">{t("secondaryCta")}</a>
            </Button>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {assurances.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-1.5">
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

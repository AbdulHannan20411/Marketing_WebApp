import { BadgeCheckIcon, GiftIcon, WalletIcon } from "lucide-react";
import { cacheLife } from "next/cache";
import { getTranslations } from "next-intl/server";

import { ConsentSettingsButton } from "@/components/analytics/analytics";
import { publicEnv } from "@/lib/env/public";
import { Link } from "@/lib/i18n/navigation";

import { Logo } from "./logo";
import { footerNav } from "./nav-config";

/** The current year, cached for a day so the footer stays in the static shell. */
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [t, consent, assurances] = await Promise.all([
    getTranslations("footer"),
    getTranslations("consent"),
    getTranslations("home.hero.assurances"),
  ]);
  const year = await getCurrentYear();

  const columns = [
    { key: "product", links: footerNav.product },
    { key: "company", links: footerNav.company },
    { key: "legal", links: footerNav.legal },
  ] as const;

  return (
    <footer className="border-t bg-surface-subtle">
      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.1fr_2fr] md:py-20">
        <div className="flex max-w-sm flex-col gap-5">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">{t("tagline")}</p>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {(
              [
                { key: "official", icon: BadgeCheckIcon },
                { key: "payments", icon: WalletIcon },
                { key: "trial", icon: GiftIcon },
              ] as const
            ).map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-md border bg-card text-brand shadow-xs">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                {assurances(key)}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t("navLabel")} className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.key}>
              <h2 className="font-mono text-xs font-medium tracking-[0.14em] text-foreground uppercase">
                {t(`columns.${column.key}`)}
              </h2>
              <ul className="mt-4 space-y-0.5">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          {/* A string, so ICU does not format it as a grouped number ("2,026"). */}
          <p>{t("copyright", { year: String(year) })}</p>
          <div className="flex flex-wrap items-center gap-x-4">
            {publicEnv.NEXT_PUBLIC_ANALYTICS_ID ? (
              <ConsentSettingsButton label={consent("settings")} />
            ) : null}
            <p>{t("madeIn")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

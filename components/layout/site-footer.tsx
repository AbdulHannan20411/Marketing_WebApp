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
  const [t, consent] = await Promise.all([getTranslations("footer"), getTranslations("consent")]);
  const year = await getCurrentYear();

  const columns = [
    { key: "product", links: footerNav.product },
    { key: "company", links: footerNav.company },
    { key: "legal", links: footerNav.legal },
  ] as const;

  return (
    <footer className="border-t bg-surface-subtle">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1fr_2fr] md:py-16">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        <nav aria-label={t("navLabel")} className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.key}>
              <h2 className="text-sm font-semibold">{t(`columns.${column.key}`)}</h2>
              <ul className="mt-3 space-y-1">
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

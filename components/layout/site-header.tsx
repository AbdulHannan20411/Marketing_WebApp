import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { appLinks } from "@/lib/site";

import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { primaryNav } from "./nav-config";
import { NavLinks } from "./nav-links";

/*
 * The nav, language switcher and mobile menu read the current path. On pages with
 * request-time URLs (e.g. /account/queries/[id]) that must sit inside <Suspense>.
 * The fallbacks have the same size and links, so nothing shifts; on statically
 * generated pages they are never shown.
 */

export async function SiteHeader() {
  const t = await getTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/65">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={t("common.brandHome")} className="-m-1 rounded-md p-1">
          <Logo />
        </Link>

        <nav aria-label={t("nav.primaryLabel")} className="hidden lg:block">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 lg:flex">
            <Suspense fallback={<span className="block h-10 w-28" aria-hidden="true" />}>
              <LanguageSwitcher />
            </Suspense>
            <ThemeToggle />
            <Button asChild variant="ghost" className="h-10 rounded-full px-4">
              <a href={appLinks.signIn}>{t("cta.signIn")}</a>
            </Button>
          </div>
          <Button asChild className="hidden h-10 rounded-full px-5 sm:inline-flex">
            <a href={appLinks.startTrial}>{t("cta.startTrial")}</a>
          </Button>
          <Suspense fallback={<span className="block size-10 lg:hidden" aria-hidden="true" />}>
            <MobileNav signInHref={appLinks.signIn} startTrialHref={appLinks.startTrial} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** The same links as NavLinks, without the current-page highlight. */
async function NavLinksFallback() {
  const t = await getTranslations("nav");
  return (
    <ul className="flex items-center gap-1">
      {primaryNav.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t(item.key)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

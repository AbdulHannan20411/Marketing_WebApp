import { getTranslations } from "next-intl/server";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { appLinks } from "@/lib/site";

import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export async function SiteHeader() {
  const t = await getTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={t("common.brandHome")} className="-m-1 rounded-md p-1">
          <Logo />
        </Link>

        <nav aria-label={t("nav.primaryLabel")} className="hidden lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 lg:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild variant="ghost" className="h-10">
              <a href={appLinks.signIn}>{t("cta.signIn")}</a>
            </Button>
          </div>
          <Button asChild className="hidden h-10 sm:inline-flex">
            <a href={appLinks.startTrial}>{t("cta.startTrial")}</a>
          </Button>
          <MobileNav signInHref={appLinks.signIn} startTrialHref={appLinks.startTrial} />
        </div>
      </div>
    </header>
  );
}

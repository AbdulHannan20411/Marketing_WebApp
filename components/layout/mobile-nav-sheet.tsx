"use client";

import { ArrowUpRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { localeMeta, locales } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { isActivePath, primaryNav } from "./nav-config";

export type MobileNavProps = {
  /** null while the main app isn't live: the sign-in button is hidden. */
  signInHref: string | null;
  /** null while the main app isn't live: the button goes to the query form. */
  startTrialHref: string | null;
};

/** The menu itself. Loaded on first use by MobileNav. */
export function MobileNavSheet({
  signInHref,
  startTrialHref,
  open,
  onOpenChange,
}: MobileNavProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="end"
        closeLabel={t("common.closeMenu")}
        className="w-[min(22rem,88vw)] gap-0 p-0"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">{t("common.menuTitle")}</SheetDescription>
        </SheetHeader>

        <nav aria-label={t("nav.primaryLabel")} className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.key}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-md px-3 text-base font-medium transition-colors hover:bg-muted",
                        active ? "bg-muted text-foreground" : "text-foreground/80",
                      )}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-4 border-t px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div
              role="group"
              aria-label={t("common.language.label")}
              className="flex gap-1 rounded-lg bg-muted p-1"
            >
              {locales.map((option) => (
                <Link
                  key={option}
                  href={pathname}
                  locale={option}
                  prefetch={false}
                  hrefLang={localeMeta[option].htmlLang}
                  lang={localeMeta[option].htmlLang}
                  aria-current={option === locale ? "true" : undefined}
                  className={cn(
                    "inline-flex h-9 min-w-16 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
                    option === locale
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`common.language.names.${option}`)}
                </Link>
              ))}
            </div>
            <ThemeToggle />
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              {startTrialHref ? (
                <a href={startTrialHref}>
                  {t("cta.startTrial")}
                  <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                </a>
              ) : (
                <Link href={{ pathname: "/contact", query: { topic: "pricing" } }}>
                  {t("cta.startTrial")}
                </Link>
              )}
            </Button>
            {signInHref ? (
              <Button asChild size="lg" variant="outline" className="w-full">
                <a href={signInHref}>{t("cta.signInToApp")}</a>
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

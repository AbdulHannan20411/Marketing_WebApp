"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/lib/i18n/navigation";
import { localeMeta, locales, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * With two languages, switching is one link to the same page in the other language
 * (/en/... ↔ /ur/...). It works for crawlers and without JavaScript, and needs no
 * menu code. The link text is the other language's own name.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common.language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const other = locales.find((option) => option !== locale) ?? locale;

  return (
    <Link
      href={pathname}
      locale={other}
      prefetch={false}
      hrefLang={localeMeta[other].htmlLang}
      aria-label={`${t("change")}: ${t(`names.${other}`)}`}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-muted",
        className,
      )}
    >
      <LanguagesIcon className="size-5" aria-hidden="true" />
      <span lang={localeMeta[other].htmlLang}>{t(`names.${other}`)}</span>
    </Link>
  );
}

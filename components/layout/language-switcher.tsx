"use client";

import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { localeMeta, locales } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches language on the current page. Items are real links (/en/... ↔ /ur/...),
 * so they work for crawlers and keep the page path.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-10 gap-1.5 px-2.5", className)}
          aria-label={`${t("change")}. ${t("current", { language: t(`names.${locale}`) })}`}
        >
          <LanguagesIcon className="size-5" aria-hidden="true" />
          <span lang={localeMeta[locale].htmlLang} className="text-sm font-medium">
            {t(`names.${locale}`)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("label")}
        </DropdownMenuLabel>
        {locales.map((option) => {
          const selected = option === locale;
          return (
            <DropdownMenuItem key={option} asChild>
              <Link
                href={pathname}
                locale={option}
                prefetch={false}
                hrefLang={localeMeta[option].htmlLang}
                lang={localeMeta[option].htmlLang}
                aria-current={selected ? "true" : undefined}
                className="flex cursor-pointer items-center justify-between gap-3"
              >
                {t(`names.${option}`)}
                {selected ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

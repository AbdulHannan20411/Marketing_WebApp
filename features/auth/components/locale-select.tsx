"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef, type ComponentProps } from "react";

import { localeMeta, locales } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/** Native <select> for the preferred email language (best accessibility on mobile). */
export const LocaleSelect = forwardRef<HTMLSelectElement, ComponentProps<"select">>(
  function LocaleSelect({ className, ...props }, ref) {
    const t = useTranslations("common.language.names");
    return (
      <div className="relative">
        <select
          ref={ref}
          {...props}
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-input bg-background ps-3 pe-10 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/20",
            className,
          )}
        >
          {locales.map((locale) => (
            <option key={locale} value={locale} lang={localeMeta[locale].htmlLang}>
              {t(locale)}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  },
);

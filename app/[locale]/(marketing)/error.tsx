"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/**
 * Error boundary for marketing pages. Shows a generic message; details stay in the
 * server logs. The digest lets support match a report to a log entry.
 */
export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      role="alert"
      className="container-page flex flex-col items-center py-20 text-center sm:py-28"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <TriangleAlertIcon className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">{t("description")}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => reset()}>
          <RotateCcwIcon className="size-4" aria-hidden="true" />
          {t("retry")}
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          {t("reference", { digest: error.digest })}
        </p>
      ) : null}
    </section>
  );
}

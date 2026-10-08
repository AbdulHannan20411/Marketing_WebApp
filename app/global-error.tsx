"use client";

import { useEffect } from "react";

import messages from "@/messages/global.json";

import "./globals.css";

/**
 * Last-resort error page when the root layout itself fails. It replaces the whole
 * document, so it cannot use next-intl; copy comes from messages/global.json and the
 * language is taken from the URL.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale =
    typeof window !== "undefined" && window.location.pathname.startsWith("/ur") ? "ur" : "en";
  const t = messages[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} dir={locale === "ur" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
        <main role="alert" className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold">{t.errorTitle}</h1>
          <p className="text-muted-foreground">{t.errorDescription}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {t.retry}
            </button>
            <a
              href={`/${locale}`}
              className="inline-flex h-11 items-center rounded-md border px-5 font-medium hover:bg-muted"
            >
              {t.home}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

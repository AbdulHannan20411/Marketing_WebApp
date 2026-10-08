import type { Metadata } from "next";

import { ThemeScript } from "@/components/theme/theme-script";
import { latinFont, urduFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import messages from "@/messages/global.json";

import "./globals.css";

export const metadata: Metadata = {
  title: `${messages.en.notFoundTitle} | NextReach`,
};

/**
 * 404 for URLs outside /en and /ur (which have their own localised 404). The language
 * is unknown here, so it shows both.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={cn(latinFont.variable, urduFont.variable)} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh items-center justify-center p-6">
        <main className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
          {(["en", "ur"] as const).map((locale) => (
            <section
              key={locale}
              lang={locale}
              dir={locale === "ur" ? "rtl" : "ltr"}
              className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center"
            >
              <h1 className="text-2xl font-bold">{messages[locale].notFoundTitle}</h1>
              <p className="text-muted-foreground">{messages[locale].notFoundDescription}</p>
              <a
                href={`/${locale}`}
                className="mt-2 inline-flex h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover"
              >
                {messages[locale].home}
              </a>
            </section>
          ))}
        </main>
      </body>
    </html>
  );
}

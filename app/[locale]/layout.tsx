import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { Analytics } from "@/components/analytics/analytics";
import { UtmCapture } from "@/components/analytics/utm-capture";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { publicEnv } from "@/lib/env/public";
import { latinFont, urduFont } from "@/lib/fonts";
import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/lib/i18n/client-messages";
import { localeMeta, routing } from "@/lib/i18n/routing";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("metadata");
  const og = hasLocale(routing.locales, locale) ? localeMeta[locale].ogLocale : "en_PK";

  return {
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    title: { default: t("defaultTitle"), template: t("titleTemplate") },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: og,
      title: t("defaultTitle"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const { dir, htmlLang } = localeMeta[locale];
  const [messages, t, consent] = await Promise.all([
    getMessages(),
    getTranslations("common"),
    getTranslations("consent"),
  ]);
  const analyticsId = publicEnv.NEXT_PUBLIC_ANALYTICS_ID;
  const clientMessages = pickMessages(messages, BASE_CLIENT_NAMESPACES);

  return (
    <html
      lang={htmlLang}
      dir={dir}
      className={cn(latinFont.variable, urduFont.variable)}
      // The inline theme script adds the `dark` class before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={clientMessages}>
          <MotionProvider>{children}</MotionProvider>
          <UtmCapture />
          {analyticsId ? (
            <Analytics
              websiteId={analyticsId}
              labels={{
                region: consent("region"),
                text: consent("text"),
                privacy: consent("privacy"),
                accept: consent("accept"),
                decline: consent("decline"),
              }}
            />
          ) : null}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

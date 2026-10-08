import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { MotionProvider } from "@/components/motion/motion-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { latinFont, urduFont } from "@/lib/fonts";
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

/** Message namespaces that Client Components need. Everything else stays on the server. */
const CLIENT_NAMESPACES = ["common", "nav", "cta"] as const;

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const { dir, htmlLang } = localeMeta[locale];
  const [messages, t] = await Promise.all([getMessages(), getTranslations("common")]);
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  );

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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

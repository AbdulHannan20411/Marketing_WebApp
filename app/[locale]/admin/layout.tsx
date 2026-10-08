import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { privatePageMetadata } from "@/features/auth/metadata";
import { requireSuperadmin } from "@/lib/auth/session";
import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/lib/i18n/client-messages";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return privatePageMetadata(t("metaTitle"));
}

/**
 * Super Admin area shell. requireSuperadmin() runs behind the Suspense boundary:
 * signed-out visitors go to sign-in, everyone else who is not an active Super
 * Admin gets a 404. Every admin server action and RLS check the role again.
 */
export default async function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  const [localeValue, messages, t] = await Promise.all([
    rootLocale(),
    getMessages(),
    getTranslations("admin"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";

  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        ...BASE_CLIENT_NAMESPACES,
        "account",
        "admin",
        "validation",
      ])}
    >
      <header className="border-b bg-background">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 rounded-md">
            <Logo />
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
              {t("title")}
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<div className="container-page py-20" />}>
          <AdminGate locale={locale}>{children}</AdminGate>
        </Suspense>
      </main>
    </NextIntlClientProvider>
  );
}

async function AdminGate({ locale, children }: { locale: Locale; children: ReactNode }) {
  await requireSuperadmin(locale);
  return <>{children}</>;
}

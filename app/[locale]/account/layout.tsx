import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AccountNav } from "@/features/auth/components/account-nav";
import { privatePageMetadata } from "@/features/auth/metadata";
import { requireUser } from "@/lib/auth/session";
import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/lib/i18n/client-messages";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return privatePageMetadata(t("metaTitle"));
}

/**
 * Customer portal shell. The header and footer are static; everything that depends
 * on the session streams in behind the Suspense boundary, where requireUser()
 * redirects signed-out or suspended visitors.
 */
export default async function AccountLayout({ children }: LayoutProps<"/[locale]/account">) {
  const [localeValue, messages, t] = await Promise.all([
    rootLocale(),
    getMessages(),
    getTranslations("account"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";

  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        ...BASE_CLIENT_NAMESPACES,
        "auth",
        "validation",
        "account",
      ])}
    >
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="container-page py-8 sm:py-12">
          <Suspense
            fallback={
              <p role="status" className="py-20 text-center text-muted-foreground">
                {t("loading")}
              </p>
            }
          >
            <AccountGate locale={locale}>{children}</AccountGate>
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </NextIntlClientProvider>
  );
}

async function AccountGate({ locale, children }: { locale: Locale; children: ReactNode }) {
  const profile = await requireUser(locale, `/${locale}/account`);
  return (
    <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <AccountNav email={profile.email} isSuperadmin={profile.role === "superadmin"} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

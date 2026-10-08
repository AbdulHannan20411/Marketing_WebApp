import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/lib/i18n/client-messages";
import { Link } from "@/lib/i18n/navigation";

/** Minimal chrome for sign-in, sign-up and password pages. */
export default async function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  const [messages, t] = await Promise.all([getMessages(), getTranslations("common")]);

  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        ...BASE_CLIENT_NAMESPACES,
        "auth",
        "validation",
        "account",
      ])}
    >
      <header className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label={t("brandHome")} className="-m-1 rounded-md p-1">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center bg-gradient-to-b from-background to-accent/40 px-4 py-10 outline-none sm:items-center sm:py-16"
      >
        {children}
      </main>
    </NextIntlClientProvider>
  );
}

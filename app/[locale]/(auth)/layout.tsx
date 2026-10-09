import { MessagesSquareIcon } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/lib/i18n/client-messages";
import { Link } from "@/lib/i18n/navigation";

/**
 * Sign-in, sign-up and password pages: the form on one side and, on large screens,
 * a deep "ink" panel explaining what the support account is for.
 */
export default async function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  const [messages, t, contact] = await Promise.all([
    getMessages(),
    getTranslations("common"),
    getTranslations("contact"),
  ]);
  const steps = ["s1", "s2", "s3"] as const;

  return (
    <NextIntlClientProvider
      messages={pickMessages(messages, [
        ...BASE_CLIENT_NAMESPACES,
        "auth",
        "validation",
        "account",
      ])}
    >
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="relative isolate flex flex-col">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade text-foreground opacity-40"
          />
          <header className="flex h-16 items-center justify-between px-4 sm:px-8">
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
            className="flex flex-1 items-start justify-center px-4 py-10 outline-none sm:items-center sm:py-16"
          >
            {children}
          </main>
        </div>

        <aside className="relative isolate hidden overflow-hidden surface-ink lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade text-ink-foreground opacity-50"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-32 -top-32 -z-10 size-[30rem] rounded-full bg-brand/25 blur-3xl"
          />
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-glow">
            <MessagesSquareIcon className="size-6" aria-hidden="true" />
          </span>
          <div className="flex max-w-md flex-col gap-8">
            <p className="text-3xl font-semibold tracking-[-0.03em] text-balance">
              {contact("nextTitle")}
            </p>
            <ol className="flex flex-col gap-5">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="pt-1 text-muted-foreground">{contact(`next.${step}`)}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </NextIntlClientProvider>
  );
}

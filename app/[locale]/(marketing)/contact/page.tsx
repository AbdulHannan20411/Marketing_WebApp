import { CircleCheckIcon, UserRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHero } from "@/components/marketing/page-hero";
import { QueryForm } from "@/features/queries/components/query-form";
import { QueryMessagesProvider } from "@/features/queries/components/query-messages-provider";
import { publicEnv } from "@/lib/env/public";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations("contact");
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: "/contact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("contact")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  const steps = ["s1", "s2", "s3"] as const;

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
          {/* Its own Suspense boundary: the form hydrates separately from the page. */}
          <Suspense>
            <QueryMessagesProvider>
              <QueryForm
                locale={locale}
                source="contact_page"
                topicFromUrl
                turnstileSiteKey={publicEnv.TURNSTILE_SITE_KEY ?? null}
              />
            </QueryMessagesProvider>
          </Suspense>
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-surface-subtle p-6">
            <h2 className="font-semibold">{t("nextTitle")}</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {steps.map((step) => (
                <li key={step} className="flex gap-3 text-sm">
                  <CircleCheckIcon
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <span>{t(`next.${step}`)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <UserRoundIcon className="size-4 text-brand" aria-hidden="true" />
              {t("accountTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("accountBody")}</p>
            <Link
              href={{ pathname: "/sign-in", query: { next: `/${locale}/contact` } }}
              className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("accountLink")}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

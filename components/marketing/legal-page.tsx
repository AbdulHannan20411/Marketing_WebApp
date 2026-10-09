import { TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { legalDetails, legalPages, type LegalPageId } from "@/content/legal";
import { isLocale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";

const paths: Record<LegalPageId, string> = {
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund-policy",
};

/** True while any company detail is still a "[placeholder]". */
const hasPlaceholders = Object.values(legalDetails).some((value) => value.startsWith("["));

export async function legalMetadata(page: LegalPageId): Promise<Metadata> {
  const locale = await rootLocale();
  const t = await getTranslations(`legal.${page}`);
  return pageMetadata({
    locale: isLocale(locale) ? locale : "en",
    path: paths[page],
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

/**
 * TODO: legal review. Structured legal template: title, effective date, contents and
 * numbered sections. Company details come from `content/legal.ts`.
 */
export async function LegalPage({ page }: { page: LegalPageId }) {
  const [t, shared] = await Promise.all([
    getTranslations(`legal.${page}`),
    getTranslations("legal.shared"),
  ]);
  // Section keys come from the typed content source; a unit test checks they all exist.
  const tk = t as unknown as (key: string, values?: Record<string, string>) => string;
  const values = {
    company: legalDetails.company,
    address: legalDetails.address,
    email: legalDetails.email,
  };
  const sections = legalPages[page].sections;

  return (
    <article className="container-page py-12 sm:py-16">
      <header className="mx-auto max-w-3xl border-b pb-8">
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {shared("effective", { date: legalDetails.effectiveDate })}
        </p>
        <p className="mt-5 text-lg text-muted-foreground">{tk("intro", values)}</p>
        {hasPlaceholders ? (
          <p
            role="note"
            className="mt-6 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          >
            <TriangleAlertIcon className="size-4 shrink-0" aria-hidden="true" />
            {shared("draftNotice")}
          </p>
        ) : null}
      </header>

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={shared("contents")} className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-semibold">{shared("contents")}</h2>
          <ol className="mt-3 flex flex-col gap-1 text-sm">
            {sections.map((key, index) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {`${index + 1}. ${tk(`sections.${key}.title`)}`}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex max-w-3xl flex-col gap-10">
          {sections.map((key, index) => (
            <section key={key} id={key} aria-labelledby={`${key}-title`} className="scroll-mt-24">
              <h2 id={`${key}-title`} className="text-xl font-semibold">
                {`${index + 1}. ${tk(`sections.${key}.title`)}`}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {tk(`sections.${key}.body`, values)}
              </p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

import { ChevronRightIcon, InboxIcon, PlusIcon } from "lucide-react";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { listMyQueries } from "@/features/portal/data";
import { LiveRefresh } from "@/features/portal/components/live-refresh";
import { StatusBadge } from "@/features/portal/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/date";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";

/** Customer portal home: the customer's queries, newest activity first. */
export default async function AccountHomePage({ searchParams }: PageProps<"/[locale]/account">) {
  const [{ status }, localeValue, t, ta, tq] = await Promise.all([
    searchParams,
    rootLocale(),
    getTranslations("portal"),
    getTranslations("account"),
    getTranslations("queryForm.topics"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  const profile = await requireUser(locale, `/${locale}/account`);
  const queries = await listMyQueries(profile);
  const unread = queries.filter((query) => query.unread).length;

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh
        channel={`portal-list-${profile.id}`}
        subscriptions={[{ table: "queries", filter: `customer_id=eq.${profile.id}` }]}
      />
      {status === "password-updated" ? (
        <FormAlert tone="success">{ta("status.passwordUpdated")}</FormAlert>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("list.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("list.subtitle")}</p>
          {unread > 0 ? (
            <p className="mt-2 text-sm font-semibold text-primary">
              {t("list.unreadCount", { count: unread })}
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline">
          <Link href="/contact">
            <PlusIcon className="size-4" aria-hidden="true" />
            {t("list.ask")}
          </Link>
        </Button>
      </div>

      {queries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <InboxIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">{t("list.empty")}</p>
          <p className="max-w-md text-sm text-muted-foreground">{t("list.emptyHint")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {queries.map((query) => (
            <li key={query.id}>
              <Link
                href={`/account/queries/${query.id}`}
                aria-label={t("list.open", { reference: query.reference })}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-[border-color,box-shadow] hover:border-brand/50 hover:shadow-sm sm:p-5"
              >
                <span
                  className="relative flex w-3 shrink-0 justify-center"
                  aria-hidden={!query.unread}
                >
                  {query.unread ? (
                    <>
                      <span className="size-2.5 rounded-full bg-brand" />
                      <span className="sr-only">{t("list.unread")}</span>
                    </>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={query.status} label={t(`status.${query.status}`)} />
                    <span className="text-xs text-muted-foreground">
                      {tq(`${query.topic}.title`)}
                    </span>
                    <code dir="ltr" className="text-xs text-muted-foreground">
                      {query.reference}
                    </code>
                  </span>
                  <span
                    className={`mt-1.5 block truncate ${query.unread ? "font-semibold" : "font-medium"}`}
                    dir="auto"
                  >
                    {query.subject}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {t("list.lastActivity", {
                      time: formatDateTime(locale, query.last_activity_at),
                    })}
                  </span>
                </span>
                <ChevronRightIcon
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

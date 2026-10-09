import { FilterXIcon, SearchIcon } from "lucide-react";
import Form from "next/form";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/features/admin/components/pagination";
import { getCustomerName, listInbox, listTeam } from "@/features/admin/data";
import {
  INBOX_PAGE_SIZE,
  inboxSearch,
  inboxSorts,
  parseInboxFilters,
  queryStatuses,
} from "@/features/admin/filters";
import { LiveRefresh } from "@/features/portal/components/live-refresh";
import { StatusBadge } from "@/features/portal/components/status-badge";
import { topicKeys } from "@/features/queries/definitions";
import { requireSuperadmin } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/date";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";

/** The queries inbox: filters in the URL, live updates, pagination. */
export default async function AdminInboxPage({
  searchParams,
}: PageProps<"/[locale]/admin/queries">) {
  const [params, localeValue, t, tq] = await Promise.all([
    searchParams,
    rootLocale(),
    getTranslations("admin"),
    getTranslations("queryForm.topics"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  const me = await requireSuperadmin(locale);
  const filters = parseInboxFilters(params);

  const [page, team, customerName] = await Promise.all([
    listInbox(filters, me),
    listTeam(),
    filters.customer ? getCustomerName(filters.customer) : Promise.resolve(null),
  ]);
  const teamName = new Map(team.map((member) => [member.id, member.name]));
  const filtered = Boolean(
    filters.q ||
    filters.status ||
    filters.topic ||
    filters.assignee ||
    filters.from ||
    filters.to ||
    filters.customer ||
    filters.sort !== "activity_desc",
  );

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh channel="admin-inbox" subscriptions={[{ table: "queries" }]} />
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("inbox.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("inbox.subtitle")}</p>
      </div>

      <Form
        action={`/${locale}/admin/queries`}
        aria-label={t("inbox.filters")}
        className="grid gap-3 rounded-2xl border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4"
      >
        {filters.customer ? <input type="hidden" name="customer" value={filters.customer} /> : null}
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
          {t("inbox.search")}
          <Input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={t("inbox.searchPlaceholder")}
            className="h-10 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("inbox.status")}
          <NativeSelect name="status" defaultValue={filters.status ?? ""}>
            <option value="">{t("inbox.anyStatus")}</option>
            {queryStatuses.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("inbox.topic")}
          <NativeSelect name="topic" defaultValue={filters.topic ?? ""}>
            <option value="">{t("inbox.anyTopic")}</option>
            {topicKeys.map((topic) => (
              <option key={topic} value={topic}>
                {tq(`${topic}.title`)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("inbox.assignee")}
          <NativeSelect name="assignee" defaultValue={filters.assignee ?? ""}>
            <option value="">{t("inbox.anyAssignee")}</option>
            <option value="me">{t("inbox.me")}</option>
            <option value="none">{t("inbox.unassigned")}</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("inbox.from")}
          <Input
            type="date"
            name="from"
            defaultValue={filters.from ?? ""}
            className="h-10 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("inbox.to")}
          <Input type="date" name="to" defaultValue={filters.to ?? ""} className="h-10 text-sm" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("inbox.sort")}
          <NativeSelect name="sort" defaultValue={filters.sort}>
            {inboxSorts.map((sort) => (
              <option key={sort} value={sort}>
                {t(`inbox.sortOptions.${sort}`)}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit">
            <SearchIcon className="size-4" aria-hidden="true" />
            {t("inbox.apply")}
          </Button>
          {filtered ? (
            <Button asChild variant="ghost">
              <Link href="/admin/queries">
                <FilterXIcon className="size-4" aria-hidden="true" />
                {t("inbox.reset")}
              </Link>
            </Button>
          ) : null}
        </div>
      </Form>

      {filters.customer && customerName ? (
        <FormAlert tone="info">
          {t("inbox.customerFilter", { name: customerName })}{" "}
          <Link
            href={`/admin/queries${inboxSearch({ ...filters, customer: null, page: 1 })}`}
            className="font-medium underline underline-offset-4"
          >
            {t("inbox.removeCustomerFilter")}
          </Link>
        </FormAlert>
      ) : null}

      {page.failed ? (
        <FormAlert tone="error">{t("inbox.loadError")}</FormAlert>
      ) : page.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          {t("inbox.empty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl border bg-card shadow-card">
          {page.rows.map((query) => (
            <li key={query.id}>
              <Link
                href={`/admin/queries/${query.id}`}
                aria-label={t("inbox.open", { reference: query.reference })}
                className="flex flex-col gap-1.5 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4"
              >
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
                    className={`mt-1 block truncate ${query.status === "new" ? "font-semibold" : "font-medium"}`}
                    dir="auto"
                  >
                    {query.subject}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground" dir="auto">
                    {`${query.name} · ${query.email}`}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col gap-0.5 text-sm text-muted-foreground sm:items-end">
                  <span>
                    {query.assignee_id
                      ? t("inbox.assignedTo", {
                          name: teamName.get(query.assignee_id) ?? t("events.someone"),
                        })
                      : t("inbox.notAssigned")}
                  </span>
                  <span>
                    {t("inbox.lastActivity", {
                      time: formatDateTime(locale, query.last_activity_at),
                    })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={filters.page}
        pageSize={INBOX_PAGE_SIZE}
        total={page.total}
        locale={locale}
        href={(n) => `/admin/queries${inboxSearch({ ...filters, page: n })}`}
      />
    </div>
  );
}

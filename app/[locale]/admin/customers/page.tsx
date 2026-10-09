import { SearchIcon } from "lucide-react";
import Form from "next/form";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/features/admin/components/pagination";
import { SuspendButton } from "@/features/admin/components/suspend-button";
import { CUSTOMERS_PAGE_SIZE, listCustomers } from "@/features/admin/data";
import { inboxSearch, sanitizeSearch } from "@/features/admin/filters";
import { requireSuperadmin } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/date";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/** Customer accounts with their query counts, search, and suspend/restore. */
export default async function AdminCustomersPage({
  searchParams,
}: PageProps<"/[locale]/admin/customers">) {
  const [params, localeValue, t] = await Promise.all([
    searchParams,
    rootLocale(),
    getTranslations("admin.customers"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  await requireSuperadmin(locale);

  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";
  const q = sanitizeSearch(first(params.q));
  const pageNumber = Math.min(10_000, Math.max(1, Number.parseInt(first(params.page), 10) || 1));
  const page = await listCustomers({ q, page: pageNumber });

  const pageHref = (n: number) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (n > 1) search.set("page", String(n));
    const value = search.toString();
    return `/admin/customers${value ? `?${value}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Form
        action={`/${locale}/admin/customers`}
        role="search"
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-medium">
          {t("search")}
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="h-10 text-sm"
          />
        </label>
        <Button type="submit">
          <SearchIcon className="size-4" aria-hidden="true" />
          {t("searchButton")}
        </Button>
      </Form>

      {page.failed ? (
        <FormAlert tone="error">{t("error")}</FormAlert>
      ) : page.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl border bg-card">
          {page.rows.map((customer) => (
            <li
              key={customer.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium" dir="auto">
                    {customer.fullName || t("noName")}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      customer.isSuspended
                        ? "bg-destructive/10 text-destructive"
                        : "bg-brand-soft text-accent-foreground",
                    )}
                  >
                    {customer.isSuspended ? t("suspended") : t("active")}
                  </span>
                </p>
                <p className="truncate text-sm text-muted-foreground" dir="ltr">
                  {customer.phone ? `${customer.email} · ${customer.phone}` : customer.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("joined", { date: formatDateTime(locale, customer.createdAt) })}
                  {" · "}
                  {t("queries", { count: customer.queryCount })}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-start gap-2">
                {customer.queryCount > 0 ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      href={`/admin/queries${inboxSearch({ customer: customer.id })}`}
                      aria-label={`${t("viewQueries")} · ${customer.email}`}
                    >
                      {t("viewQueries")}
                    </Link>
                  </Button>
                ) : null}
                <SuspendButton
                  userId={customer.id}
                  email={customer.email}
                  suspended={customer.isSuspended}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={pageNumber}
        pageSize={CUSTOMERS_PAGE_SIZE}
        total={page.total}
        locale={locale}
        href={pageHref}
      />
    </div>
  );
}

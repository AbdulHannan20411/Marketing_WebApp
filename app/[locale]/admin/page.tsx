import { ArrowRightIcon, ClockIcon, InboxIcon, SparklesIcon, TimerIcon } from "lucide-react";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { getDashboardStats, listWaiting } from "@/features/admin/data";
import { inboxSearch, queryStatuses, splitDuration } from "@/features/admin/filters";
import { LiveRefresh } from "@/features/portal/components/live-refresh";
import { StatusBadge } from "@/features/portal/components/status-badge";
import { topicKeys } from "@/features/queries/definitions";
import { requireSuperadmin } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/date";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";

/** Super Admin dashboard: counts, response time, topics and the longest-waiting queries. */
export default async function AdminDashboardPage() {
  const [localeValue, t, tq] = await Promise.all([
    rootLocale(),
    getTranslations("admin"),
    getTranslations("queryForm.topics"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  await requireSuperadmin(locale);
  const [stats, waiting] = await Promise.all([getDashboardStats(), listWaiting()]);

  const number = new Intl.NumberFormat(locale === "ur" ? "ur-PK" : "en-PK");
  const duration = (seconds: number) => {
    const parts = splitDuration(seconds);
    if (parts.unit === "minutes") return t("duration.minutes", { minutes: parts.minutes });
    if (parts.unit === "hours") return t("duration.hours", parts);
    return t("duration.days", parts);
  };

  const topics = stats
    ? topicKeys
        .map((topic) => ({ topic, count: stats.byTopic[topic] ?? 0 }))
        .sort((a, b) => b.count - a.count)
    : [];
  const maxTopic = Math.max(1, ...topics.map((item) => item.count));

  return (
    <div className="flex flex-col gap-8">
      <LiveRefresh channel="admin-dashboard" subscriptions={[{ table: "queries" }]} />
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("dashboard.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {!stats ? (
        <FormAlert tone="error">{t("dashboard.statsError")}</FormAlert>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<InboxIcon />} label={t("dashboard.total")}>
              {number.format(stats.total)}
            </StatCard>
            <StatCard icon={<ClockIcon />} label={t("dashboard.waitingNow")}>
              {number.format(stats.byStatus.new + stats.byStatus.open)}
            </StatCard>
            <StatCard icon={<SparklesIcon />} label={t("dashboard.newThisWeek")}>
              {number.format(stats.newThisWeek)}
            </StatCard>
            <StatCard
              icon={<TimerIcon />}
              label={t("dashboard.avgFirstResponse")}
              hint={
                stats.avgFirstResponseSeconds === null
                  ? t("dashboard.noResponses")
                  : t("dashboard.avgFirstResponseHint", { count: stats.respondedLast30Days })
              }
            >
              {stats.avgFirstResponseSeconds === null
                ? "—"
                : duration(stats.avgFirstResponseSeconds)}
            </StatCard>
          </ul>

          <div className="grid gap-6 lg:grid-cols-2">
            <section
              aria-labelledby="by-status"
              className="rounded-2xl border bg-card p-5 shadow-card"
            >
              <h2 id="by-status" className="font-semibold">
                {t("dashboard.byStatus")}
              </h2>
              <ul className="mt-4 flex flex-col divide-y">
                {queryStatuses.map((status) => (
                  <li key={status}>
                    <Link
                      href={`/admin/queries${inboxSearch({ status })}`}
                      className="flex items-center justify-between gap-3 rounded-md py-2.5 hover:bg-muted/60"
                    >
                      <StatusBadge status={status} label={t(`status.${status}`)} />
                      <span className="font-semibold tabular-nums">
                        {number.format(stats.byStatus[status])}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="by-topic"
              className="rounded-2xl border bg-card p-5 shadow-card"
            >
              <h2 id="by-topic" className="font-semibold">
                {t("dashboard.byTopic")}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {topics.map(({ topic, count }) => (
                  <li key={topic}>
                    <Link
                      href={`/admin/queries${inboxSearch({ topic })}`}
                      className="flex flex-col gap-1.5 rounded-md hover:bg-muted/60"
                    >
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span>{tq(`${topic}.title`)}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {t("dashboard.topicCount", { count })}
                        </span>
                      </span>
                      <span
                        className="block h-2.5 overflow-hidden rounded-full bg-muted"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ inlineSize: `${(count / maxTopic) * 100}%` }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <section aria-labelledby="waiting" className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="waiting" className="font-semibold">
              {t("dashboard.waiting")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("dashboard.waitingHint")}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/queries">
              {t("dashboard.viewAll")}
              <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {waiting.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.waitingEmpty")}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y">
            {waiting.map((query) => (
              <li key={query.id}>
                <Link
                  href={`/admin/queries/${query.id}`}
                  aria-label={t("inbox.open", { reference: query.reference })}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 hover:bg-muted/60"
                >
                  <StatusBadge status={query.status} label={t(`status.${query.status}`)} />
                  <span className="min-w-0 flex-1 truncate font-medium" dir="auto">
                    {query.subject}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("dashboard.waitingSince", {
                      time: formatDateTime(locale, query.last_activity_at),
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  hint,
  children,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-card">
      <span className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">{children}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </li>
  );
}

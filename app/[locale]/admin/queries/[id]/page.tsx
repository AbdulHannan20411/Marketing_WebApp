import { ArrowLeftIcon, FileIcon, LockIcon, MailIcon, PhoneIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Composer } from "@/features/admin/components/composer";
import { QueryControls } from "@/features/admin/components/query-controls";
import {
  getAdminQuery,
  listSavedReplies,
  listTeam,
  type AdminAttachment,
  type AdminEvent,
} from "@/features/admin/data";
import { inboxSearch, queryStatuses, type QueryStatus } from "@/features/admin/filters";
import { privatePageMetadata } from "@/features/auth/metadata";
import { LiveRefresh } from "@/features/portal/components/live-refresh";
import { StatusBadge } from "@/features/portal/components/status-badge";
import { labelAnswers } from "@/features/queries/answer-labels";
import { isTopic, querySources } from "@/features/queries/definitions";
import { requireSuperadmin } from "@/lib/auth/session";
import { formatDateTime, formatFileSize } from "@/lib/format/date";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return privatePageMetadata(t("metaTitle"));
}

type Translate = Awaited<ReturnType<typeof getTranslations<"admin">>>;

const isStatus = (value: unknown): value is QueryStatus =>
  typeof value === "string" && (queryStatuses as readonly string[]).includes(value);

/** One query for the team: answers, sender, thread with notes, composer and activity. */
export default async function AdminQueryPage({
  params,
}: PageProps<"/[locale]/admin/queries/[id]">) {
  const [{ id }, localeValue, t, tq] = await Promise.all([
    params,
    rootLocale(),
    getTranslations("admin"),
    getTranslations("queryForm.topics"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  await requireSuperadmin(locale);

  const [query, team, savedReplies] = await Promise.all([
    getAdminQuery(id),
    listTeam(),
    listSavedReplies(),
  ]);
  if (!query) notFound();

  const answers = isTopic(query.topic)
    ? await labelAnswers(query.topic, query.answers as Record<string, unknown>, locale)
    : [];
  const teamName = new Map(team.map((member) => [member.id, member.name]));
  const utm = Object.entries((query.utm ?? {}) as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
  );
  // Saved replies in the customer's language (or any language) first.
  const replies = [...savedReplies].sort(
    (a, b) => Number(b.locale === query.locale) - Number(a.locale === query.locale),
  );

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh
        channel={`admin-query-${query.id}`}
        subscriptions={[
          { table: "queries", filter: `id=eq.${query.id}` },
          { table: "query_messages", filter: `query_id=eq.${query.id}` },
        ]}
      />
      <Link
        href="/admin/queries"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("detail.back")}
      </Link>

      <header className="flex flex-col gap-3 border-b pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={query.status} label={t(`status.${query.status}`)} />
          <span className="text-sm text-muted-foreground">{tq(`${query.topic}.title`)}</span>
          <code dir="ltr" className="text-sm font-medium">
            {query.reference}
          </code>
        </div>
        <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl" dir="auto">
          {query.subject}
        </h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <Meta label={t("detail.created")}>{formatDateTime(locale, query.created_at)}</Meta>
          <Meta label={t("detail.source")}>
            {(querySources as readonly string[]).includes(query.source)
              ? t(`sources.${query.source}`)
              : query.source}
          </Meta>
          <Meta label={t("detail.language")}>{t(`locales.${query.locale}`)}</Meta>
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="answers" className="flex flex-col gap-3">
            <h2 id="answers" className="font-semibold">
              {t("detail.answers")}
            </h2>
            {answers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("detail.noAnswers")}</p>
            ) : (
              <dl className="flex flex-col gap-3">
                {answers.map((answer) => (
                  <div key={answer.question} className="flex flex-col gap-1.5">
                    <dt className="text-sm text-muted-foreground">{answer.label}</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {answer.values.map((value) => (
                        <span
                          key={value}
                          className="rounded-full border bg-brand-soft px-2.5 py-0.5 text-sm font-medium text-accent-foreground"
                        >
                          {value}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section aria-labelledby="conversation" className="flex flex-col gap-4">
            <h2 id="conversation" className="font-semibold">
              {t("detail.conversation")}
            </h2>
            <Bubble
              tone="customer"
              author={query.customer_id ? t("detail.customer") : t("detail.visitor")}
              name={query.name}
              time={formatDateTime(locale, query.created_at)}
            >
              <p className="break-words whitespace-pre-line" dir="auto">
                {query.message}
              </p>
              <Attachments
                locale={locale}
                items={query.attachments}
                label={t("detail.attachments")}
              />
            </Bubble>
            {query.messages.map((message) => {
              const fromTeam = message.authorRole === "superadmin";
              return (
                <Bubble
                  key={message.id}
                  tone={message.isInternal ? "note" : fromTeam ? "team" : "customer"}
                  author={
                    message.isInternal
                      ? t("detail.internalNote")
                      : fromTeam
                        ? t("detail.team", { name: message.authorName || t("events.someone") })
                        : t("detail.customer")
                  }
                  name={message.isInternal ? message.authorName : fromTeam ? "" : query.name}
                  time={formatDateTime(locale, message.createdAt)}
                >
                  <p className="break-words whitespace-pre-line" dir="auto">
                    {message.body}
                  </p>
                  <Attachments
                    locale={locale}
                    items={message.attachments}
                    label={t("detail.attachments")}
                  />
                </Bubble>
              );
            })}
          </section>

          <Composer
            queryId={query.id}
            customerName={query.name}
            customerEmail={query.email}
            reference={query.reference}
            closed={query.status === "closed"}
            savedReplies={replies}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl border bg-card p-5">
            <QueryControls
              queryId={query.id}
              status={query.status}
              assigneeId={query.assignee_id}
              team={team}
            />
          </div>

          <section aria-labelledby="sender" className="rounded-2xl border bg-card p-5">
            <h2 id="sender" className="font-semibold">
              {t("detail.sender")}
            </h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <SideItem label={t("detail.name")}>
                <span dir="auto">{query.name}</span>
              </SideItem>
              <SideItem label={t("detail.email")}>
                <a
                  href={`mailto:${query.email}`}
                  className="inline-flex items-center gap-1.5 break-all underline-offset-4 hover:underline"
                  dir="ltr"
                >
                  <MailIcon className="size-3.5 shrink-0" aria-hidden="true" />
                  {query.email}
                </a>
              </SideItem>
              {query.phone ? (
                <SideItem label={t("detail.phone")}>
                  <a
                    href={`tel:${query.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                    dir="ltr"
                  >
                    <PhoneIcon className="size-3.5 shrink-0" aria-hidden="true" />
                    {query.phone}
                  </a>
                </SideItem>
              ) : null}
              <SideItem label={t("detail.account")}>
                {query.customer ? (
                  <span className="flex flex-col items-start gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      {t("detail.hasAccount")}
                      {query.customer.isSuspended ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                          {t("detail.suspended")}
                        </span>
                      ) : null}
                    </span>
                    <Link
                      href={`/admin/queries${inboxSearch({ customer: query.customer.id })}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t("detail.viewCustomer")}
                    </Link>
                  </span>
                ) : (
                  t("detail.noAccount")
                )}
              </SideItem>
              {utm.length > 0 ? (
                <SideItem label={t("detail.utm")}>
                  <ul className="flex flex-col gap-0.5" dir="ltr">
                    {utm.map(([key, value]) => (
                      <li key={key} className="break-all">
                        <code className="text-xs">{`${key}=${value}`}</code>
                      </li>
                    ))}
                  </ul>
                </SideItem>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="activity" className="rounded-2xl border bg-card p-5">
            <h2 id="activity" className="font-semibold">
              {t("detail.activity")}
            </h2>
            {query.events.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("events.empty")}</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3 border-s ps-4 text-sm">
                {query.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute -start-[1.3rem] top-1.5 size-2 rounded-full bg-border"
                      aria-hidden="true"
                    />
                    <p>{describeEvent(event, t, teamName)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(locale, event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function describeEvent(event: AdminEvent, t: Translate, teamName: Map<string, string>): string {
  const actor = event.actorName || t("events.someone");
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  switch (event.type) {
    case "created": {
      const source = text(event.data.source);
      return t("events.created", {
        source: (querySources as readonly string[]).includes(source)
          ? t(`sources.${source as (typeof querySources)[number]}`)
          : source,
      });
    }
    case "status_changed": {
      const from = event.data.from;
      const to = event.data.to;
      return t("events.status_changed", {
        actor: event.actorName || t("events.system"),
        from: isStatus(from) ? t(`status.${from}`) : text(from),
        to: isStatus(to) ? t(`status.${to}`) : text(to),
      });
    }
    case "assigned": {
      const to = text(event.data.to);
      return to
        ? t("events.assigned", { actor, to: teamName.get(to) ?? t("events.someone") })
        : t("events.unassigned", { actor });
    }
    case "replied":
      return t("events.replied", { actor });
    case "customer_replied":
      return t("events.customer_replied");
    case "note_added":
      return t("events.note_added", { actor });
    case "attachment_added":
      return t("events.attachment_added", { file: text(event.data.file_name) });
    case "linked_to_account":
      return t("events.linked_to_account");
  }
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt>{`${label}:`}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

function SideItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Bubble({
  tone,
  author,
  name,
  time,
  children,
}: {
  tone: "customer" | "team" | "note";
  author: string;
  name: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1", tone === "customer" ? "items-start" : "items-end")}>
      <p className="px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          {tone === "note" ? <LockIcon className="size-3" aria-hidden="true" /> : null}
          {author}
        </span>
        {name ? ` · ${name}` : null}
        {" · "}
        {time}
      </p>
      <div
        className={cn(
          "w-full max-w-[min(42rem,92%)] rounded-2xl px-4 py-3 shadow-sm",
          tone === "customer" && "rounded-ss-sm border bg-card text-card-foreground",
          tone === "team" && "rounded-se-sm bg-primary text-primary-foreground",
          tone === "note" &&
            "rounded-se-sm border border-dashed border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Attachments({
  locale,
  items,
  label,
}: {
  locale: Locale;
  items: AdminAttachment[];
  label: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 border-t border-current/10 pt-3">
      <p className="text-xs font-semibold">{label}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`/${locale}/admin/attachments/${item.id}`}
              className="inline-flex max-w-full items-center gap-2 rounded-md bg-black/5 px-2.5 py-1.5 text-sm underline-offset-4 hover:underline dark:bg-white/10"
            >
              <FileIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate" dir="auto">
                {item.fileName}
              </span>
              <span className="shrink-0 text-xs">{formatFileSize(locale, item.sizeBytes)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

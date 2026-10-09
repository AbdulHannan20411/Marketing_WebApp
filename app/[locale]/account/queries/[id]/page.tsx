import { ArrowLeftIcon, FileIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { privatePageMetadata } from "@/features/auth/metadata";
import { getMyQuery, type PortalAttachment } from "@/features/portal/data";
import { LiveRefresh } from "@/features/portal/components/live-refresh";
import { StatusBadge } from "@/features/portal/components/status-badge";
import { MarkRead, ReplyBox, ResolveButton } from "@/features/portal/components/thread-actions";
import { labelAnswers } from "@/features/queries/answer-labels";
import { isTopic } from "@/features/queries/definitions";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatFileSize } from "@/lib/format/date";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

type Props = PageProps<"/[locale]/account/queries/[id]">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return privatePageMetadata(t("metaTitle"));
}

/** A customer's query as a conversation, with reply and resolve. */
export default async function QueryThreadPage({ params }: Props) {
  const [{ id }, localeValue, t, tq] = await Promise.all([
    params,
    rootLocale(),
    getTranslations("portal"),
    getTranslations("queryForm.topics"),
  ]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  const profile = await requireUser(locale, `/${locale}/account/queries/${id}`);
  const query = await getMyQuery(profile, id);
  if (!query) notFound();

  const answers = isTopic(query.topic)
    ? await labelAnswers(query.topic, query.answers as Record<string, unknown>, locale)
    : [];
  const closed = query.status === "closed";
  const resolved = query.status === "resolved";

  return (
    <article className="flex flex-col gap-6">
      <LiveRefresh
        channel={`portal-thread-${query.id}`}
        subscriptions={[
          { table: "query_messages", filter: `query_id=eq.${query.id}` },
          { table: "queries", filter: `id=eq.${query.id}` },
        ]}
      />
      <MarkRead queryId={query.id} unread={query.unread} />

      <Link
        href="/account"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("thread.back")}
      </Link>

      <header className="flex flex-col gap-3 border-b pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={query.status} label={t(`status.${query.status}`)} />
          {isTopic(query.topic) ? (
            <span className="text-sm text-muted-foreground">{tq(`${query.topic}.title`)}</span>
          ) : null}
        </div>
        <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl" dir="auto">
          {query.subject}
        </h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <div className="flex gap-1.5">
            <dt>{`${t("thread.reference")}:`}</dt>
            <dd>
              <code dir="ltr" className="font-medium text-foreground">
                {query.reference}
              </code>
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{`${t("thread.created")}:`}</dt>
            <dd>{formatDateTime(locale, query.created_at)}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="conversation-title" className="flex flex-col gap-4">
        <h2 id="conversation-title" className="sr-only">
          {t("thread.conversation")}
        </h2>

        <Bubble
          side="customer"
          author={t("thread.you")}
          time={formatDateTime(locale, query.created_at)}
        >
          <p className="break-words whitespace-pre-line" dir="auto">
            {query.message}
          </p>
          {answers.length > 0 ? (
            <div className="mt-3 border-t border-current/10 pt-3">
              <p className="text-xs font-semibold">{t("thread.details")}</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {answers.map((answer) => (
                  <li key={answer.question}>
                    <span>{answer.label}</span>{" "}
                    <span className="font-medium">{answer.values.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Attachments locale={locale} items={query.attachments} label={t("thread.attachments")} />
        </Bubble>

        {query.messages.map((message) => (
          <Bubble
            key={message.id}
            side={message.fromTeam ? "team" : "customer"}
            author={message.fromTeam ? t("thread.team") : t("thread.you")}
            time={formatDateTime(locale, message.createdAt)}
          >
            <p className="break-words whitespace-pre-line" dir="auto">
              {message.body}
            </p>
            <Attachments
              locale={locale}
              items={message.attachments}
              label={t("thread.attachments")}
            />
          </Bubble>
        ))}

        <p className="text-center text-xs text-muted-foreground">{t("thread.live")}</p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        {closed ? (
          <div className="flex flex-col items-start gap-3">
            <FormAlert tone="info">
              <span className="inline-flex items-center gap-1.5">
                <LockIcon className="size-4" aria-hidden="true" />
                {t("thread.closedNotice")}
              </span>
            </FormAlert>
            <Button asChild variant="outline">
              <Link href="/contact">{t("thread.newQuestion")}</Link>
            </Button>
          </div>
        ) : (
          <>
            {resolved ? <FormAlert tone="success">{t("thread.resolvedNotice")}</FormAlert> : null}
            <ReplyBox queryId={query.id} />
            {!resolved ? (
              <div className="border-t pt-4">
                <ResolveButton queryId={query.id} />
              </div>
            ) : null}
          </>
        )}
      </section>
    </article>
  );
}

function Bubble({
  side,
  author,
  time,
  children,
}: {
  side: "customer" | "team";
  author: string;
  time: string;
  children: React.ReactNode;
}) {
  const customer = side === "customer";
  return (
    <div className={cn("flex flex-col gap-1", customer ? "items-end" : "items-start")}>
      <p className="px-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{author}</span>
        {" · "}
        {time}
      </p>
      <div
        className={cn(
          "w-full max-w-[min(42rem,92%)] rounded-2xl px-4 py-3 shadow-sm",
          customer
            ? "rounded-se-sm bg-primary text-primary-foreground"
            : "rounded-ss-sm border bg-card text-card-foreground",
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
  items: PortalAttachment[];
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
              href={`/${locale}/account/attachments/${item.id}`}
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

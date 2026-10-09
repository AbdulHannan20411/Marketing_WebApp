"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, Textarea } from "@/components/ui/native-select";

import { deleteSavedReply, saveSavedReply } from "../actions";

type SavedReply = { id: string; title: string; body: string; locale: "en" | "ur" | null };
type Notice = "created" | "updated" | "deleted" | null;

/** Saved replies: add, edit inline and delete (with a confirm). */
export function SavedRepliesManager({ replies }: { replies: SavedReply[] }) {
  const t = useTranslations("admin.savedReplies");
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="new-saved-reply"
        className="rounded-2xl border bg-card p-5 shadow-card"
      >
        <h2 id="new-saved-reply" className="font-semibold">
          {t("new")}
        </h2>
        <ReplyForm
          key={`new-${replies.length}`}
          onDone={() => setNotice("created")}
          submitLabel={t("create")}
        />
      </section>

      {notice ? <FormAlert tone="success">{t(notice)}</FormAlert> : null}

      {replies.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {replies.map((reply) => (
            <li key={reply.id} className="rounded-2xl border bg-card p-5 shadow-card">
              {editing === reply.id ? (
                <ReplyForm
                  reply={reply}
                  submitLabel={t("save")}
                  onCancel={() => setEditing(null)}
                  onDone={() => {
                    setEditing(null);
                    setNotice("updated");
                  }}
                />
              ) : (
                <ReplyCard
                  reply={reply}
                  onEdit={() => {
                    setNotice(null);
                    setEditing(reply.id);
                  }}
                  onDeleted={() => setNotice("deleted")}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReplyCard({
  reply,
  onEdit,
  onDeleted,
}: {
  reply: SavedReply;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("admin.savedReplies");
  const tl = useTranslations("admin.locales");
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm(t("deleteConfirm", { title: reply.title }))) return;
    startTransition(async () => {
      const result = await deleteSavedReply(reply.id);
      setFailed(!result.ok);
      if (result.ok) onDeleted();
      router.refresh();
    });
  };

  return (
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold" dir="auto">
            {reply.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {reply.locale ? tl(reply.locale) : t("anyLanguage")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onEdit}
            aria-label={t("editLabel", { title: reply.title })}
          >
            <PencilIcon className="size-4" aria-hidden="true" />
            {t("edit")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={remove}
            aria-label={t("deleteLabel", { title: reply.title })}
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
            {t("delete")}
          </Button>
        </div>
      </div>
      <p className="text-sm whitespace-pre-line text-muted-foreground" dir="auto">
        {reply.body}
      </p>
      {failed ? <FormAlert tone="error">{t("errors.generic")}</FormAlert> : null}
    </article>
  );
}

function ReplyForm({
  reply,
  submitLabel,
  onDone,
  onCancel,
}: {
  reply?: SavedReply;
  submitLabel: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("admin.savedReplies");
  const tl = useTranslations("admin.locales");
  const router = useRouter();
  const id = useId();
  const [title, setTitle] = useState(reply?.title ?? "");
  const [body, setBody] = useState(reply?.body ?? "");
  const [locale, setLocale] = useState<string>(reply?.locale ?? "");
  const [error, setError] = useState<"title" | "body" | "generic" | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || title.trim().length > 120) return setError("title");
    if (!body.trim() || body.trim().length > 5000) return setError("body");
    setError(null);
    startTransition(async () => {
      const result = await saveSavedReply({
        ...(reply ? { id: reply.id } : {}),
        title,
        body,
        locale: locale === "en" || locale === "ur" ? locale : null,
      });
      if (result.ok) {
        onDone();
        router.refresh();
      } else {
        setError(result.error === "title" || result.error === "body" ? result.error : "generic");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-title`} className="text-sm font-medium">
            {t("titleLabel")}
          </label>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            aria-invalid={error === "title"}
            dir="auto"
            className="h-10"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-locale`} className="text-sm font-medium">
            {t("localeLabel")}
          </label>
          <NativeSelect
            id={`${id}-locale`}
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
          >
            <option value="">{t("anyLanguage")}</option>
            <option value="en">{tl("en")}</option>
            <option value="ur">{tl("ur")}</option>
          </NativeSelect>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-body`} className="text-sm font-medium">
          {t("bodyLabel")}
        </label>
        <Textarea
          id={`${id}-body`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          maxLength={5000}
          aria-invalid={error === "body"}
          dir="auto"
        />
      </div>
      {error ? <FormAlert tone="error">{t(`errors.${error}`)}</FormAlert> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {reply ? null : <PlusIcon className="size-4" aria-hidden="true" />}
          {pending ? t("saving") : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

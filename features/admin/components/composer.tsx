"use client";

import { LockIcon, MessageSquareReplyIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/native-select";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { postAdminMessage } from "../actions";
import { fillSavedReply } from "../filters";

type SavedReply = { id: string; title: string; body: string; locale: string | null };
type Mode = "reply" | "note";
type Status = "sent" | "noteAdded" | "empty" | "tooLong" | "generic" | null;

const MAX = 5000;

/** Reply to the customer (emailed) or add an internal note, with saved replies. */
export function Composer({
  queryId,
  customerName,
  customerEmail,
  reference,
  closed,
  savedReplies,
}: {
  queryId: string;
  customerName: string;
  customerEmail: string;
  reference: string;
  closed: boolean;
  savedReplies: SavedReply[];
}) {
  const t = useTranslations("admin.detail");
  const router = useRouter();
  const id = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>("reply");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || trimmed.length > MAX) {
      setStatus(trimmed ? "tooLong" : "empty");
      textarea.current?.focus();
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const result = await postAdminMessage({ queryId, body: trimmed, internal: mode === "note" });
      if (result.ok) {
        setBody("");
        setStatus(mode === "note" ? "noteAdded" : "sent");
        router.refresh();
      } else {
        setStatus(
          result.error === "empty" || result.error === "tooLong" ? result.error : "generic",
        );
      }
    });
  };

  const insertSaved = (savedId: string) => {
    const saved = savedReplies.find((reply) => reply.id === savedId);
    if (!saved) return;
    const text = fillSavedReply(saved.body, { name: customerName, reference });
    setBody((current) => (current.trim() ? `${current.trimEnd()}\n\n${text}` : text));
    setStatus(null);
    textarea.current?.focus();
  };

  const error = status === "empty" || status === "tooLong" || status === "generic" ? status : null;
  const note = mode === "note";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:p-5",
        note
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
          : "bg-card",
      )}
    >
      <div role="group" aria-label={t("composer.label")} className="flex flex-wrap gap-2">
        {(["reply", "note"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={mode === option ? "default" : "outline"}
            aria-pressed={mode === option}
            onClick={() => {
              setMode(option);
              setStatus(null);
            }}
          >
            {option === "reply" ? (
              <MessageSquareReplyIcon className="size-4" aria-hidden="true" />
            ) : (
              <LockIcon className="size-4" aria-hidden="true" />
            )}
            {option === "reply" ? t("composer.replyTab") : t("composer.noteTab")}
          </Button>
        ))}
      </div>

      {!note && savedReplies.length > 0 ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label htmlFor={`${id}-saved`} className="text-sm font-medium">
              {t("composer.savedReply")}
            </label>
            <NativeSelect
              id={`${id}-saved`}
              value=""
              onChange={(event) => insertSaved(event.target.value)}
            >
              <option value="">{t("composer.savedReplyNone")}</option>
              {savedReplies.map((reply) => (
                <option key={reply.id} value={reply.id}>
                  {reply.locale ? `${reply.title} (${reply.locale.toUpperCase()})` : reply.title}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Link
            href="/admin/saved-replies"
            className="min-h-10 content-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("composer.manageSaved")}
          </Link>
        </div>
      ) : null}

      <label htmlFor={`${id}-body`} className="text-sm font-medium">
        {note ? t("composer.noteLabel") : t("composer.replyLabel")}
      </label>
      <Textarea
        ref={textarea}
        id={`${id}-body`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={6}
        maxLength={MAX}
        dir="auto"
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {note ? t("composer.noteHint") : t("composer.replyHint", { email: customerEmail })}
        {!note && closed ? ` ${t("composer.closedHint")}` : null}
      </p>
      {error ? (
        <div id={`${id}-error`}>
          <FormAlert tone="error">{t(`errors.${error}`)}</FormAlert>
        </div>
      ) : null}
      {status === "sent" ? <FormAlert tone="success">{t("composer.sent")}</FormAlert> : null}
      {status === "noteAdded" ? (
        <FormAlert tone="success">{t("composer.noteAdded")}</FormAlert>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {note ? (
            <LockIcon className="size-4" aria-hidden="true" />
          ) : (
            <SendIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          )}
          {pending ? t("composer.sending") : note ? t("composer.addNote") : t("composer.send")}
        </Button>
      </div>
    </form>
  );
}

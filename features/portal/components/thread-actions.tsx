"use client";

import { CircleCheckIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";

import {
  markMyQueryRead,
  replyToMyQuery,
  resolveMyQuery,
  type PortalActionError,
} from "../actions";

const MAX = 5000;

/** Reply composer for the customer's own query. */
export function ReplyBox({ queryId }: { queryId: string }) {
  const t = useTranslations("portal.thread");
  const router = useRouter();
  const id = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"sent" | Exclude<PortalActionError, "notSignedIn"> | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      setStatus("empty");
      textarea.current?.focus();
      return;
    }
    if (trimmed.length > MAX) {
      setStatus("tooLong");
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const result = await replyToMyQuery({ queryId, body: trimmed });
      if (result.ok) {
        setBody("");
        setStatus("sent");
        router.refresh();
      } else {
        setStatus(result.error === "notSignedIn" ? "generic" : result.error);
      }
    });
  };

  const error = status && status !== "sent" ? status : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor={`${id}-reply`} className="text-sm font-medium">
        {t("replyLabel")}
      </label>
      <textarea
        ref={textarea}
        id={`${id}-reply`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        maxLength={MAX}
        dir="auto"
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/20"
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {t("replyHint")}
      </p>
      {error ? (
        <div id={`${id}-error`}>
          <FormAlert tone="error">{t(`errors.${error}`)}</FormAlert>
        </div>
      ) : null}
      {status === "sent" ? <FormAlert tone="success">{t("sent")}</FormAlert> : null}
      <div>
        <Button type="submit" disabled={pending}>
          <SendIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {pending ? t("sending") : t("send")}
        </Button>
      </div>
    </form>
  );
}

/** "Mark as resolved" for the customer's own query. */
export function ResolveButton({ queryId }: { queryId: string }) {
  const t = useTranslations("portal.thread");
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await resolveMyQuery(queryId);
            setFailed(!result.ok);
            router.refresh();
          })
        }
      >
        <CircleCheckIcon className="size-4" aria-hidden="true" />
        {pending ? t("resolving") : t("resolve")}
      </Button>
      {failed ? <FormAlert tone="error">{t("errors.generic")}</FormAlert> : null}
    </div>
  );
}

/** Marks the query as read when it is opened (clears the unread dot). */
export function MarkRead({ queryId, unread }: { queryId: string; unread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!unread) return;
    void markMyQueryRead(queryId).then(() => router.refresh());
  }, [queryId, unread, router]);
  return null;
}

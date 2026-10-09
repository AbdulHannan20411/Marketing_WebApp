"use client";

import { SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/native-select";

import { saveAdminSettings, type AdminActionResult } from "../actions";

type Settings = { recipients: string[]; ackEn: string; ackUr: string };

/** Notification recipients and the acknowledgement texts (en and ur). */
export function SettingsForm({ initial }: { initial: Settings }) {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  const id = useId();
  const [recipients, setRecipients] = useState(initial.recipients.join("\n"));
  const [ackEn, setAckEn] = useState(initial.ackEn);
  const [ackUr, setAckUr] = useState(initial.ackUr);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await saveAdminSettings({ recipients, ackEn, ackUr });
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  };

  const error = result && !result.ok ? result : null;
  const message = error
    ? error.error === "invalidEmail"
      ? t("errors.invalidEmail", { email: error.detail ?? "" })
      : error.error === "tooMany" || error.error === "tooLong"
        ? t(`errors.${error.error}`)
        : t("errors.generic")
    : null;

  const field = (
    key: string,
    label: string,
    hint: string,
    value: string,
    onChange: (value: string) => void,
    options: { rows: number; maxLength: number; dir: "ltr" | "auto" | "rtl" },
  ) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-${key}`} className="text-sm font-medium">
        {label}
      </label>
      <Textarea
        id={`${id}-${key}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-${key}-hint`}
        {...options}
      />
      <p id={`${id}-${key}-hint`} className="text-sm text-muted-foreground">
        {hint}
      </p>
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-card"
    >
      {field("recipients", t("recipients"), t("recipientsHint"), recipients, setRecipients, {
        rows: 4,
        maxLength: 5000,
        dir: "ltr",
      })}
      {field("ack-en", t("ackEn"), t("ackHint"), ackEn, setAckEn, {
        rows: 4,
        maxLength: 2000,
        dir: "ltr",
      })}
      {field("ack-ur", t("ackUr"), t("ackHint"), ackUr, setAckUr, {
        rows: 4,
        maxLength: 2000,
        dir: "rtl",
      })}
      {message ? <FormAlert tone="error">{message}</FormAlert> : null}
      {result?.ok ? <FormAlert tone="success">{t("saved")}</FormAlert> : null}
      <div>
        <Button type="submit" disabled={pending}>
          <SaveIcon className="size-4" aria-hidden="true" />
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

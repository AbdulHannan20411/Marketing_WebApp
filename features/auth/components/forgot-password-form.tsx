"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

import { forgotPasswordAction, type AuthErrorCode } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { applyServerErrors } from "./use-server-errors";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (sentTo) headingRef.current?.focus();
  }, [sentTo]);

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(form.getValues(), locale);
      if (result.ok) {
        setSentTo(values.email);
      } else {
        setError((applyServerErrors(result, form.setError) as AuthErrorCode | null) ?? null);
      }
    });
  });

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-accent-foreground">
          <MailCheckIcon className="size-7" aria-hidden="true" />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {t("forgot.sentTitle")}
        </h2>
        <p role="status" className="text-muted-foreground">
          {t("forgot.sentBody", { email: sentTo })}
        </p>
        <Link
          href="/sign-in"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("forgot.back")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? <FormAlert tone="error">{t(`errors.${error}`)}</FormAlert> : null}
      <Field label={t("forgot.email")} error={form.formState.errors.email?.message} required>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            dir="ltr"
            {...form.register("email")}
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t("forgot.submitting") : t("forgot.submit")}
      </Button>
      <Link
        href="/sign-in"
        className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("forgot.back")}
      </Link>
    </form>
  );
}

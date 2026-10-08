"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

import { resendConfirmationAction, signUpAction, type AuthErrorCode } from "../actions";
import { signUpSchema, type SignUpInput, type SignUpOutput } from "../schemas";
import { LocaleSelect } from "./locale-select";
import { applyServerErrors } from "./use-server-errors";

export function SignUpForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [pending, startTransition] = useTransition();
  const successRef = useRef<HTMLHeadingElement>(null);
  const emailFromLink = useSearchParams().get("email")?.slice(0, 254) ?? "";

  const form = useForm<SignUpInput, unknown, SignUpOutput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: emailFromLink,
      phone: "",
      password: "",
      confirmPassword: "",
      preferredLocale: locale,
      consent: false as unknown as true,
    },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  // Move focus to the confirmation heading so screen readers announce it.
  useEffect(() => {
    if (sentTo) successRef.current?.focus();
  }, [sentTo]);

  // The server re-validates the raw input with the same schema.
  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    const raw = form.getValues();
    startTransition(async () => {
      const result = await signUpAction(raw);
      if (result.ok) {
        setSentTo(values.email);
        return;
      }
      setError((applyServerErrors(result, form.setError) as AuthErrorCode | null) ?? null);
    });
  });

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-accent-foreground">
          <MailCheckIcon className="size-7" aria-hidden="true" />
        </span>
        <h2 ref={successRef} tabIndex={-1} className="text-xl font-semibold outline-none">
          {t("signUp.successTitle")}
        </h2>
        <p className="text-muted-foreground" role="status">
          {t("signUp.successBody", { email: sentTo })}
        </p>
        <p className="text-sm text-muted-foreground">{t("signUp.successHint")}</p>
        {resent ? <FormAlert tone="success">{t("signIn.resent")}</FormAlert> : null}
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resendConfirmationAction(sentTo, locale);
              setResent(true);
            })
          }
        >
          {t("signIn.resend")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? <FormAlert tone="error">{t(`errors.${error}`)}</FormAlert> : null}

      <Field label={t("signUp.fullName")} error={errors.fullName?.message} required>
        {(control) => <Input {...control} autoComplete="name" {...form.register("fullName")} />}
      </Field>

      <Field label={t("signUp.email")} error={errors.email?.message} required>
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

      <Field label={t("signUp.phone")} hint={t("signUp.phoneHint")} error={errors.phone?.message}>
        {(control) => (
          <Input
            {...control}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            dir="ltr"
            {...form.register("phone")}
          />
        )}
      </Field>

      <Field
        label={t("signUp.password")}
        hint={t("signUp.passwordHint")}
        error={errors.password?.message}
        required
      >
        {(control) => (
          <PasswordInput {...control} autoComplete="new-password" {...form.register("password")} />
        )}
      </Field>

      <Field label={t("signUp.confirmPassword")} error={errors.confirmPassword?.message} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        )}
      </Field>

      <Field label={t("signUp.language")} error={errors.preferredLocale?.message}>
        {(control) => <LocaleSelect {...control} {...form.register("preferredLocale")} />}
      </Field>

      <div className="flex flex-col gap-1.5">
        <Controller
          control={form.control}
          name="consent"
          render={({ field }) => (
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? "consent-error" : undefined}
                className="mt-0.5 size-5"
              />
              <span>
                {t.rich("signUp.consent", {
                  terms: (chunks) => (
                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-medium text-primary underline underline-offset-4"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-medium text-primary underline underline-offset-4"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
          )}
        />
        {errors.consent ? (
          <p id="consent-error" className="text-sm font-medium text-destructive">
            {tv("consent")}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t("signUp.submitting") : t("signUp.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("signUp.haveAccount")}{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("signUp.signInLink")}
        </Link>
      </p>
    </form>
  );
}

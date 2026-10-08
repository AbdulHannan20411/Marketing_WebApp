"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

import { resetPasswordAction, type AuthErrorCode } from "../actions";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { applyServerErrors } from "./use-server-errors";

/** Shown after the reset link signs the user in; saves the new password. */
export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(values, locale);
      setError((applyServerErrors(result, form.setError) as AuthErrorCode | null) ?? null);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <FormAlert tone="error">
          {t(`errors.${error}`)}
          {error === "linkExpired" ? (
            <>
              {" "}
              <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
                {t("reset.requestNew")}
              </Link>
            </>
          ) : null}
        </FormAlert>
      ) : null}
      <Field
        label={t("reset.password")}
        hint={t("signUp.passwordHint")}
        error={errors.password?.message}
        required
      >
        {(control) => (
          <PasswordInput {...control} autoComplete="new-password" {...form.register("password")} />
        )}
      </Field>
      <Field label={t("reset.confirmPassword")} error={errors.confirmPassword?.message} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        )}
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t("reset.submitting") : t("reset.submit")}
      </Button>
    </form>
  );
}

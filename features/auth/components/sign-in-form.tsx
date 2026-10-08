"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

import { resendConfirmationAction, signInAction, type AuthErrorCode } from "../actions";
import { signInSchema, type SignInInput } from "../schemas";
import { applyServerErrors } from "./use-server-errors";

const urlMessages = { link: "link", suspended: "suspended", "signed-out": "signedOut" } as const;

export function SignInForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const urlError = searchParams.get("error");
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const [resent, setResent] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setResent(false);
    startTransition(async () => {
      const result = await signInAction(values, locale, next);
      // On success the action redirects, so a result here is an error.
      setError((applyServerErrors(result, form.setError) as AuthErrorCode | null) ?? "generic");
    });
  });

  const resend = () =>
    startTransition(async () => {
      await resendConfirmationAction(form.getValues("email"), locale);
      setResent(true);
    });

  const banner =
    urlError && urlError in urlMessages ? urlMessages[urlError as keyof typeof urlMessages] : null;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {banner && !error ? (
        <FormAlert tone={banner === "signedOut" ? "info" : "error"}>
          {t(`errors.${banner}`)}
        </FormAlert>
      ) : null}
      {error ? (
        <FormAlert tone="error">
          {t(`errors.${error}`)}
          {error === "emailNotConfirmed" ? (
            <button
              type="button"
              onClick={resend}
              disabled={pending}
              className="ms-1 font-semibold underline underline-offset-4"
            >
              {t("signIn.resend")}
            </button>
          ) : null}
        </FormAlert>
      ) : null}
      {resent ? <FormAlert tone="success">{t("signIn.resent")}</FormAlert> : null}

      <Field label={t("signIn.email")} error={errors.email?.message} required>
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

      <Field label={t("signIn.password")} error={errors.password?.message} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            {...form.register("password")}
          />
        )}
      </Field>

      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("signIn.forgot")}
        </Link>
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t("signIn.submitting") : t("signIn.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("signIn.noAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("signIn.signUpLink")}
        </Link>
      </p>
    </form>
  );
}

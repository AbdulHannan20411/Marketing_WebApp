"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/forms/field";
import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n/routing";

import { changePasswordAction, updateProfileAction, type AuthErrorCode } from "../actions";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
  type ProfileOutput,
} from "../schemas";
import { LocaleSelect } from "./locale-select";
import { applyServerErrors } from "./use-server-errors";

type ProfileFormProps = {
  email: string;
  defaults: { fullName: string; phone: string; preferredLocale: Locale };
};

export function ProfileDetailsForm({ email, defaults }: ProfileFormProps) {
  const t = useTranslations("account.profile");
  const ta = useTranslations("auth.errors");
  const router = useRouter();
  const [status, setStatus] = useState<"saved" | AuthErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ProfileInput, unknown, ProfileOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
    mode: "onTouched",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setStatus(null);
    const raw = form.getValues();
    startTransition(async () => {
      const result = await updateProfileAction(raw);
      if (result.ok) {
        setStatus("saved");
        form.reset(raw);
        router.refresh();
      } else {
        setStatus((applyServerErrors(result, form.setError) as AuthErrorCode | null) ?? null);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {status === "saved" ? <FormAlert tone="success">{t("saved")}</FormAlert> : null}
      {status && status !== "saved" ? <FormAlert tone="error">{ta(status)}</FormAlert> : null}

      <Field label={t("email")} hint={t("emailHint")}>
        {(control) => <Input {...control} type="email" value={email} readOnly disabled dir="ltr" />}
      </Field>
      <Field label={t("fullName")} error={errors.fullName?.message} required>
        {(control) => <Input {...control} autoComplete="name" {...form.register("fullName")} />}
      </Field>
      <Field label={t("phone")} hint={t("phoneHint")} error={errors.phone?.message}>
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
      <Field label={t("language")} error={errors.preferredLocale?.message}>
        {(control) => <LocaleSelect {...control} {...form.register("preferredLocale")} />}
      </Field>
      <div>
        <Button type="submit" disabled={pending || !form.formState.isDirty}>
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("account.profile");
  const ta = useTranslations("auth");
  const [status, setStatus] = useState<"changed" | AuthErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setStatus(null);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.ok) {
        setStatus("changed");
        form.reset();
      } else {
        setStatus((applyServerErrors(result, form.setError) as AuthErrorCode | null) ?? null);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {status === "changed" ? <FormAlert tone="success">{t("passwordChanged")}</FormAlert> : null}
      {status && status !== "changed" ? (
        <FormAlert tone="error">{ta(`errors.${status}`)}</FormAlert>
      ) : null}

      <Field label={t("currentPassword")} error={errors.currentPassword?.message} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            {...form.register("currentPassword")}
          />
        )}
      </Field>
      <Field
        label={t("newPassword")}
        hint={ta("signUp.passwordHint")}
        error={errors.password?.message}
        required
      >
        {(control) => (
          <PasswordInput {...control} autoComplete="new-password" {...form.register("password")} />
        )}
      </Field>
      <Field label={t("confirmPassword")} error={errors.confirmPassword?.message} required>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
        )}
      </Field>
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? t("changingPassword") : t("changePassword")}
        </Button>
      </div>
    </form>
  );
}

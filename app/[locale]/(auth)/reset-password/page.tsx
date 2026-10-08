import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { privatePageMetadata } from "@/features/auth/metadata";
import { isLocale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset");
  return privatePageMetadata(t("metaTitle"));
}

/** Reached from the password-reset email (the link signs the user in first). */
export default async function ResetPasswordPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("auth.reset")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <ResetPasswordForm locale={locale} />
    </AuthCard>
  );
}

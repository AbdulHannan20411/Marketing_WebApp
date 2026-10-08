import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { privatePageMetadata } from "@/features/auth/metadata";
import { isLocale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgot");
  return privatePageMetadata(t("metaTitle"));
}

export default async function ForgotPasswordPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("auth.forgot")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <ForgotPasswordForm locale={locale} />
    </AuthCard>
  );
}

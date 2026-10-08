import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { privatePageMetadata } from "@/features/auth/metadata";
import { isLocale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signUp");
  return privatePageMetadata(t("metaTitle"));
}

export default async function SignUpPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("auth.signUp")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")} showAppNotice>
      {/* Reads ?email= (from the query success screen), so it renders at request time. */}
      <Suspense fallback={<div className="h-[36rem]" />}>
        <SignUpForm locale={locale} />
      </Suspense>
    </AuthCard>
  );
}

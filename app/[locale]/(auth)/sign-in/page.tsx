import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { privatePageMetadata } from "@/features/auth/metadata";
import { isLocale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signIn");
  return privatePageMetadata(t("metaTitle"));
}

export default async function SignInPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("auth.signIn")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")} showAppNotice>
      {/* The form reads ?next and ?error from the URL, so it renders at request time. */}
      <Suspense fallback={<div className="h-80" />}>
        <SignInForm locale={locale} />
      </Suspense>
    </AuthCard>
  );
}

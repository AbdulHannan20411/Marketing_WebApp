import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { ChangePasswordForm, ProfileDetailsForm } from "@/features/auth/components/profile-forms";
import { privatePageMetadata } from "@/features/auth/metadata";
import { requireUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.profile");
  return privatePageMetadata(t("metaTitle"));
}

export default async function ProfilePage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("account.profile")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  const profile = await requireUser(locale, `/${locale}/account/profile`);

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <section aria-labelledby="details-title" className="flex flex-col gap-5">
        <h2 id="details-title" className="text-lg font-semibold">
          {t("detailsTitle")}
        </h2>
        <ProfileDetailsForm
          email={profile.email}
          defaults={{
            fullName: profile.full_name,
            phone: profile.phone ?? "",
            preferredLocale: profile.locale,
          }}
        />
      </section>
      <section aria-labelledby="password-title" className="flex flex-col gap-5 border-t pt-8">
        <h2 id="password-title" className="text-lg font-semibold">
          {t("passwordTitle")}
        </h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}

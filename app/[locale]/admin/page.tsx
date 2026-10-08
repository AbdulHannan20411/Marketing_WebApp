import { ShieldCheckIcon } from "lucide-react";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { requireSuperadmin } from "@/lib/auth/session";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";

/** Placeholder until Phase 7 builds the dashboard, inbox and settings. */
export default async function AdminHomePage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("admin")]);
  const locale = isLocale(localeValue) ? localeValue : "en";
  const profile = await requireSuperadmin(locale);

  return (
    <section className="container-page flex flex-col items-start gap-4 py-12">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-accent-foreground">
        <ShieldCheckIcon className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("welcome", { email: profile.email })}</p>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
      <Button asChild variant="outline">
        <Link href="/">{t("backToSite")}</Link>
      </Button>
    </section>
  );
}

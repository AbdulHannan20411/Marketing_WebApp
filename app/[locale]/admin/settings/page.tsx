import { MessageSquareTextIcon } from "lucide-react";
import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/features/admin/components/settings-form";
import { getAdminSettings } from "@/features/admin/data";
import { requireSuperadmin } from "@/lib/auth/session";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";

/** Notification recipients, acknowledgement texts, and a way to the saved replies. */
export default async function AdminSettingsPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("admin.settings")]);
  await requireSuperadmin(isLocale(localeValue) ? localeValue : "en");
  const settings = await getAdminSettings();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {settings ? (
        <SettingsForm
          initial={{
            recipients: settings.notification_recipients,
            ackEn: settings.auto_ack_en,
            ackUr: settings.auto_ack_ur,
          }}
        />
      ) : (
        <FormAlert tone="error">{t("loadError")}</FormAlert>
      )}

      <section
        aria-labelledby="saved-replies"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-card"
      >
        <div>
          <h2 id="saved-replies" className="font-semibold">
            {t("savedRepliesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("savedRepliesText")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/saved-replies">
            <MessageSquareTextIcon className="size-4" aria-hidden="true" />
            {t("savedRepliesLink")}
          </Link>
        </Button>
      </section>
    </div>
  );
}

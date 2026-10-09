import { locale as rootLocale } from "next/root-params";
import { getTranslations } from "next-intl/server";

import { SavedRepliesManager } from "@/features/admin/components/saved-replies";
import { listSavedReplies } from "@/features/admin/data";
import { requireSuperadmin } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/routing";

/** CRUD for the reusable replies offered in the query composer. */
export default async function AdminSavedRepliesPage() {
  const [localeValue, t] = await Promise.all([rootLocale(), getTranslations("admin.savedReplies")]);
  await requireSuperadmin(isLocale(localeValue) ? localeValue : "en");
  const replies = await listSavedReplies();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <SavedRepliesManager replies={replies} />
    </div>
  );
}

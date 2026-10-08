import { InboxIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/**
 * Customer portal home. Phase 6 replaces the empty state with the list of the
 * customer's queries (with unread dots and the thread view).
 */
export default async function AccountHomePage({ searchParams }: PageProps<"/[locale]/account">) {
  const [{ status }, t] = await Promise.all([searchParams, getTranslations("account")]);

  return (
    <div className="flex flex-col gap-6">
      {status === "password-updated" ? (
        <FormAlert tone="success">{t("status.passwordUpdated")}</FormAlert>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight">{t("queries.title")}</h1>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
        <InboxIcon className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">{t("queries.empty")}</p>
        <p className="max-w-md text-sm text-muted-foreground">{t("queries.emptyHint")}</p>
        <Button asChild className="mt-2">
          <Link href="/contact">{t("queries.ask")}</Link>
        </Button>
      </div>
    </div>
  );
}

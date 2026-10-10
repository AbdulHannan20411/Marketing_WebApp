import { InfoIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { appLinks } from "@/lib/site";

/** Card wrapper for auth pages, with the "this is not the app" notice when relevant. */
export async function AuthCard({
  title,
  subtitle,
  showAppNotice = false,
  children,
}: {
  title: string;
  subtitle?: string;
  showAppNotice?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations("auth");
  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-card shadow-lift sm:p-9">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[1.75rem]">{title}</h1>
      {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
      {showAppNotice && appLinks.signIn ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm">
          <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            {t.rich("appNotice", {
              link: (chunks) => (
                <a
                  href={appLinks.signIn ?? undefined}
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {chunks}
                </a>
              ),
            })}
          </span>
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

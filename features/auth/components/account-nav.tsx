"use client";

import { InboxIcon, LogOutIcon, ShieldIcon, UserRoundIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { signOutAction } from "../actions";

/** Account navigation with the current page marked, plus sign out. */
export function AccountNav({ email, isSuperadmin }: { email: string; isSuperadmin: boolean }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const items = [
    { href: "/account", label: t("nav.queries"), icon: InboxIcon, exact: true },
    { href: "/account/profile", label: t("nav.profile"), icon: UserRoundIcon, exact: false },
    ...(isSuperadmin
      ? [{ href: "/admin", label: t("nav.admin"), icon: ShieldIcon, exact: false }]
      : []),
  ];

  return (
    <nav aria-label={t("nav.label")} className="flex flex-col gap-4">
      <p className="truncate text-sm text-muted-foreground" dir="auto">
        {t("signedInAs", { email })}
      </p>
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => signOutAction(locale))}
            className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t("nav.signOut")}
          </button>
        </li>
      </ul>
    </nav>
  );
}

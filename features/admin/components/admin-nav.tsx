"use client";

import {
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareTextIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { signOutAction } from "@/features/auth/actions";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/queries", key: "queries", icon: InboxIcon, exact: false },
  { href: "/admin/customers", key: "customers", icon: UsersIcon, exact: false },
  { href: "/admin/saved-replies", key: "savedReplies", icon: MessageSquareTextIcon, exact: false },
  { href: "/admin/settings", key: "settings", icon: SettingsIcon, exact: false },
] as const;

/** Admin section tabs with the current one marked, plus sign out. */
export function AdminNav() {
  const t = useTranslations("admin.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <nav aria-label={t("label")} className="border-b bg-background">
      <ul className="container-page flex items-center gap-1 overflow-x-auto py-2">
        {items.map(({ href, key, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {t(key)}
              </Link>
            </li>
          );
        })}
        <li className="ms-auto shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => signOutAction(locale))}
            className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t("signOut")}
          </button>
        </li>
      </ul>
    </nav>
  );
}

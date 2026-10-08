"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { applyTheme, readStoredTheme, storeTheme, type Theme } from "./theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("common.theme");
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // React Strict Mode's dev remount resets <html> attributes; re-apply the stored theme.
  // This is a no-op in production because the inline script already applied it.
  useLayoutEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-10", className)}
      aria-label={next === "dark" ? t("switchToDark") : t("switchToLight")}
      title={next === "dark" ? t("switchToDark") : t("switchToLight")}
      onClick={() => {
        applyTheme(next);
        storeTheme(next);
      }}
    >
      <SunIcon className="size-5 dark:hidden" aria-hidden="true" />
      <MoonIcon className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  );
}

"use client";

import { type VariantProps } from "class-variance-authority";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type ReactNode } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n/routing";

import type { QuerySource, Topic } from "../definitions";

function FormLoading() {
  const t = useTranslations("queryForm");
  return (
    <p role="status" className="py-16 text-center text-muted-foreground">
      {t("loading")}
    </p>
  );
}

// The form (and its validation code) loads the first time the dialog opens.
const QueryForm = dynamic(() => import("./query-form").then((mod) => mod.QueryForm), {
  ssr: false,
  loading: () => <FormLoading />,
});

type QueryDialogTriggerProps = {
  children: ReactNode;
  source: QuerySource;
  topic?: Topic;
  turnstileSiteKey?: string | null;
  className?: string;
} & VariantProps<typeof buttonVariants>;

/**
 * Opens the guided query form in a dialog. It is a real link to /contact, so it still
 * works before JavaScript loads (or without it); with JavaScript it opens in place.
 */
export function QueryDialogTrigger({
  children,
  source,
  topic,
  turnstileSiteKey,
  className,
  variant,
  size,
}: QueryDialogTriggerProps) {
  const t = useTranslations("queryForm");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const href = `/${locale}/contact${topic ? `?topic=${topic}` : ""}`;

  return (
    <>
      <Button asChild variant={variant} size={size} className={className}>
        <a
          ref={triggerRef}
          href={href}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            setOpen(true);
          }}
          aria-haspopup="dialog"
        >
          {children}
        </a>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel={t("close")}
          className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl"
          // Return focus to the link that opened the dialog.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          {open ? (
            <QueryForm
              locale={locale}
              source={source}
              initialTopic={topic}
              turnstileSiteKey={turnstileSiteKey}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

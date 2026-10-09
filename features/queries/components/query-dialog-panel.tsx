"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";

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

/** The dialog itself. Loaded on first use by QueryDialogTrigger. */
export function QueryDialogPanel({
  open,
  onOpenChange,
  triggerRef,
  locale,
  source,
  topic,
  turnstileSiteKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLAnchorElement | null>;
  locale: Locale;
  source: QuerySource;
  topic?: Topic;
  turnstileSiteKey?: string | null;
}) {
  const t = useTranslations("queryForm");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}

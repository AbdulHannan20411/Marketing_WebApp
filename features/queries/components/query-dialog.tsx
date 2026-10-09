"use client";

import { type VariantProps } from "class-variance-authority";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { useRef, useState, type ReactNode } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";

import type { QuerySource, Topic } from "../definitions";

// The dialog (Radix) and the form load on first use, not with the page. Hovering or
// focusing the link starts the download so the dialog opens without a wait.
const loadPanel = () => import("./query-dialog-panel").then((mod) => mod.QueryDialogPanel);
const QueryDialogPanel = dynamic(loadPanel, { ssr: false });

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
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const href = `/${locale}/contact${topic ? `?topic=${topic}` : ""}`;

  return (
    <>
      <Button asChild variant={variant} size={size} className={className}>
        <a
          ref={triggerRef}
          href={href}
          onPointerEnter={() => void loadPanel()}
          onFocus={() => void loadPanel()}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            setUsed(true);
            setOpen(true);
          }}
          aria-haspopup="dialog"
        >
          {children}
        </a>
      </Button>
      {used ? (
        <QueryDialogPanel
          open={open}
          onOpenChange={setOpen}
          triggerRef={triggerRef}
          locale={locale}
          source={source}
          topic={topic}
          turnstileSiteKey={turnstileSiteKey}
        />
      ) : null}
    </>
  );
}

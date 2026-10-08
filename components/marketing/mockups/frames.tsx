import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A desktop-app style card frame for product mock-ups. Decorative. */
export function MockWindow({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xl shadow-slate-900/5 dark:shadow-black/30",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b bg-surface-subtle px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        {title ? <p className="truncate text-xs font-semibold">{title}</p> : null}
        {action ? <div className="ms-auto">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** A small rounded pill used for statuses and tags in mock-ups. */
export function MockPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warning" | "danger" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "brand" && "bg-brand-soft text-accent-foreground",
        tone === "warning" && "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        tone === "danger" && "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
        tone === "info" && "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** WhatsApp-style chat bubble. `out` is the business side. */
export function ChatBubble({
  side,
  children,
  className,
  style,
}: {
  side: "in" | "out";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-snug shadow-sm",
        side === "out"
          ? "ms-auto rounded-se-sm bg-wa-out text-slate-900 dark:text-slate-50"
          : "me-auto rounded-ss-sm bg-wa-in text-slate-900 dark:text-slate-50",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Initials avatar. */
export function MockAvatar({ name, className }: { name: string; className?: string }) {
  const initial = Array.from(name.trim())[0] ?? "";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-accent-foreground",
        className,
      )}
    >
      {initial}
    </span>
  );
}

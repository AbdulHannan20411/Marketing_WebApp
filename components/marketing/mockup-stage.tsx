import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A framed backdrop for product mock-ups: a tinted panel with a dot texture and a
 * soft brand glow, so illustrations sit in a composed space instead of floating.
 */
export function MockupStage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/80 via-surface-subtle to-card p-5 shadow-card sm:p-10",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-dots mask-fade text-foreground opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-20 -top-24 -z-10 size-64 rounded-full bg-brand/20 blur-3xl"
      />
      {children}
    </div>
  );
}

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Form-level message. Errors use role="alert" (announced immediately); success uses
 * role="status" (announced politely).
 */
export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? CircleAlertIcon : CircleCheckIcon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        tone === "error" &&
          "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-300",
        tone === "success" && "border-brand/40 bg-accent text-accent-foreground",
        tone === "info" && "border-border bg-muted text-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

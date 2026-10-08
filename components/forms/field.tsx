"use client";

import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FieldControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  "aria-required"?: boolean;
};

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  /** A validation code (translated via `validation.<code>`) or a ready message. */
  error?: string;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

const knownCodes = new Set([
  "required",
  "email",
  "nameLength",
  "phone",
  "passwordMin",
  "passwordMax",
  "passwordMismatch",
  "consent",
]);

/**
 * Label + control + hint + error, wired together for assistive tech: the control gets
 * aria-invalid and aria-describedby pointing at the hint and the error.
 */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const t = useTranslations("validation");
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const message = error
    ? knownCodes.has(error)
      ? t(error as Parameters<typeof t>[0])
      : error
    : null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {message ? (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}

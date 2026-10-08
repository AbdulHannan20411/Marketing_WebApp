"use client";

import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

export type OptionItem = { value: string; label: string; description?: string; icon?: ReactNode };

type OptionGroupProps = {
  legend: string;
  hint?: string;
  error?: string;
  /** single → radio buttons; multi → checkboxes. Native inputs give keyboard support. */
  kind: "single" | "multi";
  options: OptionItem[];
  registration: UseFormRegisterReturn;
  columns?: 1 | 2 | 3;
  size?: "md" | "lg";
  legendId?: string;
  /** Visually hide the legend (still announced) when a heading already says it. */
  legendHidden?: boolean;
};

/**
 * Option cards backed by real radio/checkbox inputs inside a fieldset: arrow keys move
 * between radios, Space toggles checkboxes, and screen readers announce the group.
 */
export function OptionGroup({
  legend,
  hint,
  error,
  kind,
  options,
  registration,
  columns = 2,
  size = "md",
  legendId,
  legendHidden = false,
}: OptionGroupProps) {
  const errorId = error ? `${registration.name}-error` : undefined;
  const hintId = hint ? `${registration.name}-hint` : undefined;
  return (
    <fieldset
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? true : undefined}
      className="flex flex-col gap-3"
    >
      <legend id={legendId} className={cn("mb-1 font-semibold", legendHidden && "sr-only")}>
        {legend}
      </legend>
      {hint ? (
        <p id={hintId} className="-mt-2 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div
        className={cn(
          "grid gap-2.5",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "group relative flex cursor-pointer items-start gap-3 rounded-xl border bg-card transition-[border-color,background-color,box-shadow]",
              size === "lg" ? "p-4" : "px-3.5 py-3",
              "hover:border-brand/50 has-[:checked]:border-brand has-[:checked]:bg-accent has-[:checked]:shadow-sm",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
              error && "border-destructive/60",
            )}
          >
            <input
              type={kind === "single" ? "radio" : "checkbox"}
              value={option.value}
              className="peer sr-only"
              {...registration}
            />
            {option.icon ? (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-accent-foreground">
                {option.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center border border-input text-transparent transition-colors",
                kind === "single" ? "rounded-full" : "rounded-md",
                "group-has-[:checked]:border-brand group-has-[:checked]:bg-brand group-has-[:checked]:text-white",
              )}
            >
              <CheckIcon className="size-3.5" />
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

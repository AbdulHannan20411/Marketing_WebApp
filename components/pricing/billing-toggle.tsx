"use client";

import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export type BillingPeriod = "monthly" | "yearly";

type BillingToggleProps = {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  labels: { group: string; monthly: string; yearly: string; badge: string | null };
};

const periods: BillingPeriod[] = ["monthly", "yearly"];

/**
 * Monthly/yearly switch as an ARIA radio group: Tab focuses the selected option,
 * arrow keys move between them (in either writing direction).
 */
export function BillingToggle({ value, onChange, labels }: BillingToggleProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key))
      return;
    event.preventDefault();
    const index = periods.indexOf(value);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? periods.length - 1
          : (index + 1) % periods.length;
    const period = periods[next] ?? "monthly";
    onChange(period);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="radiogroup"
        aria-label={labels.group}
        className="relative grid grid-cols-2 rounded-full border bg-muted p-1"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 start-1 w-[calc(50%-0.25rem)] rounded-full bg-background shadow-sm transition-transform duration-300 ease-out",
            value === "yearly" && "translate-x-full rtl:-translate-x-full",
          )}
        />
        {periods.map((period, index) => (
          <button
            key={period}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={value === period}
            tabIndex={value === period ? 0 : -1}
            onClick={() => onChange(period)}
            onKeyDown={onKeyDown}
            className={cn(
              "relative z-10 min-w-28 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              value === period ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labels[period]}
          </button>
        ))}
      </div>
      {labels.badge ? <p className="text-sm font-medium text-primary">{labels.badge}</p> : null}
    </div>
  );
}

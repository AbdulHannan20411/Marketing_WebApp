import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Brand mark: a chat bubble with an outgoing arrow. Decorative; the wordmark carries the name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill="var(--color-brand)" />
      <path
        d="M9 21.5V12a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5.5a3 3 0 0 1-3 3h-6.5L9 24v-2.5Z"
        fill="#fff"
      />
      <path
        d="m15 15.5 4-3.5m0 0h-3m3 0v3"
        stroke="var(--color-brand)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {/* The brand name is always Latin script, even on Urdu pages. */}
      <span lang="en" dir="ltr" className="font-sans text-lg font-semibold tracking-tight">
        {BRAND_NAME}
      </span>
    </span>
  );
}

import { cn } from "@/lib/utils";

/** Small "New" pill for recently launched features and modules. */
export function NewBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-primary px-2 py-0.5 text-xs leading-4 font-semibold text-primary-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

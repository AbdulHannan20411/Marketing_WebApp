import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type QueryStatus = Database["public"]["Enums"]["query_status"];

const tones: Record<QueryStatus, string> = {
  new: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  open: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  awaiting_customer: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  resolved: "bg-brand-soft text-accent-foreground",
  closed: "bg-muted text-muted-foreground",
};

/** Query status pill. The label is passed in (customer and admin wording differ). */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: QueryStatus;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[status],
        className,
      )}
    >
      {label}
    </span>
  );
}

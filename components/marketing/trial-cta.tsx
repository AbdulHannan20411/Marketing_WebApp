import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";

import { Button, type buttonVariants } from "@/components/ui/button";
import type { QuerySource } from "@/features/queries/definitions";
import { QueryDialogButton } from "@/features/queries/components/query-dialog-button";
import { appLinks } from "@/lib/site";
import type { VariantProps } from "class-variance-authority";

type TrialCtaProps = {
  label: string;
  /** Where the lead came from, if the button opens the query form. */
  source?: QuerySource;
  className?: string;
  /** Show the trailing arrow. */
  icon?: boolean;
} & VariantProps<typeof buttonVariants>;

/**
 * "Start free trial". With the main app live it links there; until then it opens
 * the guided query form on "Pricing & plans", so the visitor's request reaches the
 * admin inbox (and works as a link to /contact without JavaScript).
 */
export function TrialCta({
  label,
  source = "dialog",
  className,
  icon = true,
  variant,
  size,
}: TrialCtaProps) {
  if (appLinks.startTrial) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href={appLinks.startTrial}>
          {label}
          {icon ? (
            <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          ) : null}
        </a>
      </Button>
    );
  }
  return (
    <QueryDialogButton
      source={source}
      topic="pricing"
      variant={variant}
      size={size}
      className={className}
    >
      {label}
      {icon ? <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" /> : null}
    </QueryDialogButton>
  );
}

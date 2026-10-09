import { ArrowUpRightIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { QuerySource } from "@/features/queries/definitions";
import { QueryDialogButton } from "@/features/queries/components/query-dialog-button";
import { Link } from "@/lib/i18n/navigation";

type CtaBandProps = {
  title: string;
  subtitle: string;
  /** External link into the NextReach app (free trial). */
  primary?: { label: string; href: string };
  /** Internal link, e.g. /about. */
  secondary?: { label: string; href: string };
  /** Opens the guided query form in a dialog (falls back to /contact without JS). */
  secondaryDialog?: { label: string; source: QuerySource };
};

/**
 * Closing call-to-action: a deep "ink" panel with a quiet grid and a brand glow.
 * Copy sits on the reading side, actions on the other (stacked on small screens).
 */
export function CtaBand({ title, subtitle, primary, secondary, secondaryDialog }: CtaBandProps) {
  return (
    <section className="py-16 [contain-intrinsic-size:auto_480px] [content-visibility:auto] sm:py-24">
      <div className="container-page">
        <Reveal className="relative isolate overflow-hidden rounded-2xl surface-ink px-6 py-12 shadow-lift sm:px-12 sm:py-16 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade text-ink-foreground opacity-50"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-32 -top-40 -z-10 size-[28rem] rounded-full bg-brand/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -start-20 -bottom-24 -z-10 size-72 rounded-full bg-emerald-300/10 blur-3xl"
          />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="flex max-w-2xl flex-col gap-4">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-display">
                {title}
              </h2>
              <p className="text-lg text-pretty text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
              {primary ? (
                <Button asChild size="lg" variant="inverse">
                  <a href={primary.href}>
                    {primary.label}
                    <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
              {secondary ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              ) : null}
              {secondaryDialog ? (
                <QueryDialogButton source={secondaryDialog.source} size="lg" variant="outline">
                  {secondaryDialog.label}
                </QueryDialogButton>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

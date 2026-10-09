import { Suspense, type ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /**
   * Background: page colour, a quiet tint to separate neighbours, or the deep "ink"
   * statement surface (tokens are re-mapped, so content adapts automatically).
   */
  tone?: "default" | "subtle" | "ink";
  labelledBy?: string;
};

/**
 * Page section with consistent vertical rhythm.
 *
 * Performance: sections are mostly below the fold, so `content-visibility: auto` lets
 * the browser skip their layout and paint until they near the viewport (they stay in
 * the accessibility tree and find-in-page), and each section is its own Suspense
 * boundary so React hydrates the page in smaller pieces instead of one long task.
 */
export function Section({ id, children, className, tone = "default", labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative isolate scroll-mt-20 py-20 [contain-intrinsic-size:auto_800px] [content-visibility:auto] sm:py-24 lg:py-28",
        tone === "subtle" && "border-y border-border/70 bg-surface-subtle",
        tone === "ink" && "overflow-hidden surface-ink",
        className,
      )}
    >
      {tone === "ink" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade text-ink-foreground opacity-60"
        />
      ) : null}
      <div className="container-page">
        <Suspense>{children}</Suspense>
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /**
   * "center" stacks everything centred; "start" aligns to the reading edge;
   * "split" puts the title on one side and the subtitle (and actions) on the other.
   */
  align?: "center" | "start" | "split";
  /** Heading level; sections under a page h1 use h2. */
  level?: 1 | 2;
  className?: string;
  children?: ReactNode;
};

export function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
  level = 2,
  className,
  children,
}: SectionHeaderProps) {
  const Heading = level === 1 ? "h1" : "h2";
  const heading = (
    <Heading
      id={id}
      className={cn(
        "font-semibold tracking-[-0.03em] text-balance",
        level === 1 ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl lg:text-display",
      )}
    >
      {title}
    </Heading>
  );

  if (align === "split") {
    return (
      <Reveal
        className={cn(
          "grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16",
          className,
        )}
      >
        <div className="flex flex-col items-start gap-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          {heading}
        </div>
        {subtitle || children ? (
          <div className="flex flex-col items-start gap-5">
            {subtitle ? (
              <p className="text-lg text-pretty text-muted-foreground">{subtitle}</p>
            ) : null}
            {children}
          </div>
        ) : null}
      </Reveal>
    );
  }

  return (
    <Reveal
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {heading}
      {subtitle ? (
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{subtitle}</p>
      ) : null}
      {children}
    </Reveal>
  );
}

/** Small mono label above a heading, led by a short brand rule. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 font-mono text-xs font-medium tracking-[0.16em] text-primary uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-6 shrink-0 bg-brand" />
      {children}
    </p>
  );
}

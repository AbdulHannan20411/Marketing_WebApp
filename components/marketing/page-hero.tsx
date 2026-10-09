import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Eyebrow } from "./section";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  align?: "center" | "start";
  className?: string;
};

/**
 * Top-of-page hero for inner pages. Not wrapped in <Reveal>: it is the largest
 * contentful paint, so it must be visible immediately.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  align = "start",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn("relative isolate overflow-hidden border-b bg-surface-subtle", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade text-foreground opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-48 -z-10 mx-auto h-96 max-w-4xl rounded-full bg-brand/15 blur-3xl"
      />
      <div
        className={cn(
          "container-page flex flex-col gap-6 pt-16 pb-14 sm:pt-24 sm:pb-20",
          align === "center" ? "items-center text-center" : "items-start text-start",
        )}
      >
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

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
  align = "center",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b bg-gradient-to-b from-accent/60 to-background",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-80 max-w-3xl rounded-full bg-brand/15 blur-3xl"
      />
      <div
        className={cn(
          "relative container-page flex flex-col gap-5 py-16 sm:py-20",
          align === "center" ? "items-center text-center" : "items-start text-start",
        )}
      >
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{subtitle}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

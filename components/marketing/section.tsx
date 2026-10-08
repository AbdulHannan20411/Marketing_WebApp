import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Subtle tinted background to separate neighbouring sections. */
  tone?: "default" | "subtle";
  labelledBy?: string;
};

/** Page section with consistent vertical rhythm. */
export function Section({ id, children, className, tone = "default", labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "scroll-mt-20 py-16 sm:py-20 lg:py-24",
        tone === "subtle" && "bg-surface-subtle",
        className,
      )}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
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
  return (
    <Reveal
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        id={id}
        className={cn(
          "font-bold tracking-tight text-balance",
          level === 1 ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl",
        )}
      >
        {title}
      </Heading>
      {subtitle ? <p className="text-lg text-pretty text-muted-foreground">{subtitle}</p> : null}
      {children}
    </Reveal>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center rounded-full border border-brand/25 bg-accent px-3 py-1 text-sm font-medium text-accent-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

import { staggerDelay } from "./effects";

type RevealProps = {
  children: ReactNode;
  /** Position in a list: staggers siblings by 40ms steps, capped at 280ms. */
  index?: number;
  /** Delay in milliseconds, for one-off offsets. `index` is preferred for lists. */
  delay?: number;
  as?: ElementType;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "style">;

/**
 * Fades and lifts its content into view on scroll. Server-rendered: no per-instance
 * JavaScript. See `RevealObserver` and the `[data-reveal]` rules in globals.css.
 * Content stays visible without JavaScript and for reduced-motion visitors.
 */
export function Reveal({
  children,
  index,
  delay = 0,
  as: Tag = "div",
  className,
  ...rest
}: RevealProps) {
  const ms = index !== undefined ? staggerDelay(index) : delay;
  return (
    <Tag
      {...rest}
      data-reveal=""
      className={className}
      style={ms ? ({ "--reveal-delay": `${ms}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

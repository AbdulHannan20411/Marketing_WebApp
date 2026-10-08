import type { CSSProperties, ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Delay in milliseconds, for staggering siblings. */
  delay?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Fades and lifts its content into view on scroll. Server-rendered: no per-instance
 * JavaScript. See `RevealObserver` and the `[data-reveal]` rules in globals.css.
 * Content stays visible without JavaScript and for reduced-motion visitors.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className }: RevealProps) {
  return (
    <Tag
      data-reveal=""
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

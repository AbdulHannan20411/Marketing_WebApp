"use client";

import { inView } from "motion";
import { useEffect, useRef, useState } from "react";

type AnimatedNumberProps = {
  /** A real number only. Never use this for invented statistics. */
  value: number;
  format?: (value: number) => string;
  durationMs?: number;
  className?: string;
};

const defaultFormat = (value: number) => String(value);

/**
 * Counts up to `value` once when scrolled into view. Server-renders the final value,
 * so it is correct without JavaScript and for reduced-motion visitors.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  durationMs = 1200,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const stop = inView(
      element,
      () => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { amount: 0.6 },
    );

    return () => {
      stop();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {/* Screen readers always get the final value, not the intermediate frames. */}
      <span aria-hidden="true">{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

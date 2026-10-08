"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { RevealObserver } from "./reveal-observer";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Global Motion settings.
 * - `LazyMotion` + `m.*` components keep Motion's engine out of the first bundle
 *   (`strict` makes a stray `motion.*` import an error).
 * - `reducedMotion="user"` turns off transform animations for visitors who ask for
 *   reduced motion; our own components also check it and render their final state.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        {children}
        <RevealObserver />
      </MotionConfig>
    </LazyMotion>
  );
}

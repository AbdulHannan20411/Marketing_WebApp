/**
 * Motion primitives for server and client components alike. Each one is a class name or a
 * set of data attributes; the "Pointer effects" rules in globals.css and the single listener
 * in <PointerEffects> do the work, so no component needs its own listener or state.
 * Every effect is off for touch and coarse pointers and under reduced motion.
 */

/** A soft green spotlight under the pointer, and the hover lift unless `lift` is false. */
export function spotlight({
  lift = true,
  small = false,
}: { lift?: boolean; small?: boolean } = {}) {
  if (!lift) return "spotlight";
  return small ? "spotlight lift lift-sm" : "spotlight lift";
}

/** Hover lift only (no spotlight): rises 2px (1px when small) with a larger shadow. */
export function lift({ small = false }: { small?: boolean } = {}) {
  return small ? "lift lift-sm" : "lift";
}

/** Tilts up to 3° towards the pointer; combines with the lift in one transform. */
export const tilt = { "data-tilt": "" } as const;

/** Pulls a primary button up to 8px towards the pointer (0.6× that vertically). */
export const magnetic = { "data-magnetic": "" } as const;

/** Adds the pointer-following green glow to an element the default selector doesn't cover. */
export const hoverGlow = { "data-hover-glow": "" } as const;

/** Keeps an element (and its children) out of the hover glow. */
export const noHover = { "data-no-hover": "" } as const;

const STAGGER_STEP_MS = 40;
const STAGGER_MAX_MS = 280;

/** Reveal delay for the nth item of a list: 40ms steps, capped so long lists never wait. */
export function staggerDelay(index: number) {
  return Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS);
}

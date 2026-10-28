"use client";

import { useEffect } from "react";

/** Rows, links and tabs that get the green glow under the pointer. Opt out with data-no-hover. */
const GLOW_SELECTOR = [
  "[role=tab]",
  "[role=menuitem]",
  "[role=option]",
  ".segmented > button",
  ".segmented > a",
  "tbody > tr",
  "ul.divide-y > li",
  "[data-hover-glow]",
].join(",");

const TILT_MAX_DEG = 3;
const MAGNET_MAX_PX = 8;
const MAGNET_Y_RATIO = 0.6;

/** Fine pointer, real hover, motion allowed: the only case where pointer effects run. */
const ALLOWED_QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * One delegated, passive pointer listener for the glow, spotlight, tilt and magnetic effects
 * (see the "Pointer effects" rules in globals.css). It is throttled to one update per frame
 * and writes only CSS variables and data attributes, so React never re-renders on mouse move.
 * Off on touch and coarse pointers and for visitors who ask for reduced motion.
 */
export function PointerEffects() {
  useEffect(() => {
    const allowed = window.matchMedia(ALLOWED_QUERY);
    let stop: (() => void) | undefined;
    const sync = () => {
      stop?.();
      stop = allowed.matches ? startPointerEffects() : undefined;
    };
    sync();
    allowed.addEventListener("change", sync);
    return () => {
      allowed.removeEventListener("change", sync);
      stop?.();
    };
  }, []);

  return null;
}

type Active = {
  glow: HTMLElement | null;
  spot: HTMLElement | null;
  tilt: HTMLElement | null;
  magnet: HTMLElement | null;
};

function startPointerEffects() {
  const active: Active = { glow: null, spot: null, tilt: null, magnet: null };
  let frame = 0;
  let x = 0;
  let y = 0;
  let hasPointer = false;
  // The magnet's current offset, so its resting centre can be found while it is pulled.
  let magX = 0;
  let magY = 0;

  const swap = (key: keyof Active, next: HTMLElement | null, reset: (el: HTMLElement) => void) => {
    const previous = active[key];
    if (previous && previous !== next) reset(previous);
    active[key] = next;
  };
  const resetGlow = (el: HTMLElement) => el.removeAttribute("data-glow");
  const resetTilt = (el: HTMLElement) => {
    el.style.removeProperty("--tilt-x");
    el.style.removeProperty("--tilt-y");
  };
  const resetMagnet = (el: HTMLElement) => {
    el.style.removeProperty("--mag-x");
    el.style.removeProperty("--mag-y");
    magX = 0;
    magY = 0;
  };
  const noop = () => {};

  const update = () => {
    frame = 0;
    const target = hasPointer ? document.elementFromPoint(x, y) : null;

    let glow = target?.closest<HTMLElement>(GLOW_SELECTOR) ?? null;
    if (glow?.closest("[data-no-hover]")) glow = null;
    swap("glow", glow, resetGlow);
    if (glow) {
      const rect = glow.getBoundingClientRect();
      glow.style.setProperty("--glow-x", `${x - rect.left}px`);
      glow.style.setProperty("--glow-y", `${y - rect.top}px`);
      glow.setAttribute("data-glow", "");
    }

    const spot = target?.closest<HTMLElement>(".spotlight") ?? null;
    swap("spot", spot, noop);
    if (spot) {
      const rect = spot.getBoundingClientRect();
      spot.style.setProperty("--spot-x", `${x - rect.left}px`);
      spot.style.setProperty("--spot-y", `${y - rect.top}px`);
    }

    const tilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
    swap("tilt", tilt, resetTilt);
    if (tilt) {
      const rect = tilt.getBoundingClientRect();
      // -0.5 … 0.5 across the element; the side under the pointer tips towards the viewer.
      const px = (x - rect.left) / rect.width - 0.5;
      const py = (y - rect.top) / rect.height - 0.5;
      tilt.style.setProperty("--tilt-x", `${(-py * 2 * TILT_MAX_DEG).toFixed(2)}deg`);
      tilt.style.setProperty("--tilt-y", `${(px * 2 * TILT_MAX_DEG).toFixed(2)}deg`);
    }

    const magnet = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
    swap("magnet", magnet, resetMagnet);
    if (magnet) {
      const rect = magnet.getBoundingClientRect();
      const cx = rect.left - magX + rect.width / 2;
      const cy = rect.top - magY + rect.height / 2;
      const dx = Math.max(-1, Math.min(1, (x - cx) / (rect.width / 2)));
      const dy = Math.max(-1, Math.min(1, (y - cy) / (rect.height / 2)));
      magX = dx * MAGNET_MAX_PX;
      magY = dy * MAGNET_MAX_PX * MAGNET_Y_RATIO;
      magnet.style.setProperty("--mag-x", `${magX.toFixed(2)}px`);
      magnet.style.setProperty("--mag-y", `${magY.toFixed(2)}px`);
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    x = event.clientX;
    y = event.clientY;
    hasPointer = true;
    schedule();
  };
  const onOut = (event: PointerEvent) => {
    // Leaving the window: relatedTarget is null.
    if (event.relatedTarget) return;
    hasPointer = false;
    schedule();
  };
  // Content scrolls under a still pointer: hit-test again at the same spot.
  const onScroll = () => {
    if (hasPointer) schedule();
  };

  const options: AddEventListenerOptions = { passive: true };
  document.addEventListener("pointermove", onMove, options);
  document.addEventListener("pointerout", onOut, options);
  window.addEventListener("scroll", onScroll, options);

  return () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerout", onOut);
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
    if (active.glow) resetGlow(active.glow);
    if (active.tilt) resetTilt(active.tilt);
    if (active.magnet) resetMagnet(active.magnet);
  };
}

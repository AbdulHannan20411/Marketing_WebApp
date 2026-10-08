"use client";

import { inView } from "motion";
import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not([data-revealed])";

/**
 * One observer for every <Reveal> on the page. Elements start hidden via CSS (only when
 * JS runs and the visitor allows motion) and get `data-revealed` as they scroll into
 * view, which triggers a transform/opacity CSS transition. New elements added by
 * client-side navigation are picked up through a MutationObserver.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    // The inline head script sets data-js; re-set it in case React's dev remount cleared it.
    root.setAttribute("data-js", "");
    // Cancels the CSS failsafe that would otherwise reveal everything after a few seconds.
    root.setAttribute("data-reveal-ready", "");

    const reveal = (element: Element) => element.setAttribute("data-revealed", "");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(SELECTOR).forEach(reveal);
      const mutations = new MutationObserver(() =>
        document.querySelectorAll(SELECTOR).forEach(reveal),
      );
      mutations.observe(document.body, { childList: true, subtree: true });
      return () => mutations.disconnect();
    }

    const watched = new WeakSet<Element>();
    const stops: Array<() => void> = [];

    const watch = () => {
      document.querySelectorAll(SELECTOR).forEach((element) => {
        if (watched.has(element)) return;
        watched.add(element);
        stops.push(
          inView(
            element,
            (target) => {
              reveal(target);
            },
            { margin: "0px 0px -8% 0px", amount: 0.15 },
          ),
        );
      });
    };

    watch();
    const mutations = new MutationObserver(watch);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      stops.forEach((stop) => stop());
    };
  }, []);

  return null;
}

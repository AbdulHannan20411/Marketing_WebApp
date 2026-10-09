"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { HeroMockupStrings } from "./hero-mockup";

/** Same footprint as the real mock-up, so swapping it in causes no layout shift. */
function HeroMockupPlaceholder({ business }: { business: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[22rem] pb-24 sm:pb-16">
      <div className="overflow-hidden rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20 dark:border-slate-700">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white dark:bg-[#1f2c34]">
          <span className="size-9 rounded-full bg-white/20" />
          <span className="text-sm font-semibold">{business}</span>
        </div>
        <div className="h-[23rem] bg-wa-wallpaper" />
        <div className="flex items-center gap-2 bg-wa-wallpaper px-2 pb-2">
          <span className="h-10 flex-1 rounded-full bg-white dark:bg-[#2a3942]" />
          <span className="size-10 rounded-full bg-[#00a884]" />
        </div>
      </div>
    </div>
  );
}

// The animation code (and Motion's engine) loads once the page has finished loading
// and the browser is idle, so it never competes with the first render.
const HeroMockup = dynamic(() => import("./hero-mockup"), {
  ssr: false,
  loading: () => null,
});

export function HeroMockupLoader({
  strings,
  label,
}: {
  strings: HeroMockupStrings;
  label: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const start = () => {
      // Safari has no requestIdleCallback.
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
      } else {
        timer = window.setTimeout(() => setReady(true), 300);
      }
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <figure role="img" aria-label={label} className="relative">
      <div aria-hidden="true" className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        <HeroMockupPlaceholder business={strings.business} />
        <div className="relative">{ready ? <HeroMockup strings={strings} /> : null}</div>
      </div>
    </figure>
  );
}

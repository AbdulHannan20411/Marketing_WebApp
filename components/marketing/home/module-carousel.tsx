"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModuleSlide = {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
};

type ModuleCarouselProps = {
  slides: ModuleSlide[];
  labels: {
    region: string;
    previous: string;
    next: string;
    slide: string;
    /** Already-formatted "{current} of {total}" for each index, from the server. */
    positions: string[];
  };
};

type ScrollState = { active: number; atStart: boolean; atEnd: boolean };

/**
 * Scroll-snap carousel: works with touch, trackpad and keyboard scrolling even before
 * hydration; the buttons add one-slide steps. No autoplay. RTL aware: "start" is the
 * right edge in Urdu, and the scroll position is measured from there.
 */
export function ModuleCarousel({ slides, labels }: ModuleCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [state, setState] = useState<ScrollState>({ active: 0, atStart: true, atEnd: false });
  const regionId = useId();
  const trackId = `${regionId}-track`;

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rtl = getComputedStyle(track).direction === "rtl";
    const trackRect = track.getBoundingClientRect();
    const items = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));

    let active = 0;
    let best = Number.POSITIVE_INFINITY;
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const distance = rtl
        ? Math.abs(trackRect.right - rect.right)
        : Math.abs(rect.left - trackRect.left);
      if (distance < best) {
        best = distance;
        active = index;
      }
    });

    const scrolled = Math.abs(track.scrollLeft);
    const max = track.scrollWidth - track.clientWidth;
    setState({ active, atStart: scrolled < 2, atEnd: scrolled >= max - 2 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [measure]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const items = track?.querySelectorAll<HTMLElement>("[data-slide]");
    const target = items?.[Math.max(0, Math.min(index, slides.length - 1))];
    if (!track || !target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rtl = getComputedStyle(track).direction === "rtl";
    const trackRect = track.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    // Positive delta moves towards the end in both directions.
    const delta = rtl ? rect.right - trackRect.right : rect.left - trackRect.left;
    track.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="relative"
    >
      <ul
        ref={trackRef}
        id={trackId}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-4 focus-visible:outline-offset-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <li
            key={slide.key}
            data-slide=""
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
          >
            {/* The group role sits on the article so the <li> stays a list item. */}
            <article
              role="group"
              aria-roledescription={labels.slide}
              aria-label={labels.positions[index]}
              className={cn(
                "flex h-full flex-col gap-3 rounded-2xl border bg-card p-6 transition-[border-color,transform] duration-300",
                index === state.active ? "border-brand/50" : "hover:-translate-y-0.5",
              )}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-accent-foreground">
                {slide.icon}
              </span>
              <h3 className="text-lg font-semibold">{slide.title}</h3>
              <p className="text-muted-foreground">{slide.description}</p>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-1.5" aria-hidden="true">
          {slides.map((slide, index) => (
            <span
              key={slide.key}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-300",
                index === state.active ? "w-6 bg-brand" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {labels.positions[state.active]}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            aria-label={labels.previous}
            aria-controls={trackId}
            disabled={state.atStart}
            onClick={() => goTo(state.active - 1)}
          >
            <ChevronLeftIcon className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            aria-label={labels.next}
            aria-controls={trackId}
            disabled={state.atEnd}
            onClick={() => goTo(state.active + 1)}
          >
            <ChevronRightIcon className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

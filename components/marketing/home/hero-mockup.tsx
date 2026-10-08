"use client";

import {
  CheckCheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  SendIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type HeroMockupStrings = {
  business: string;
  status: string;
  today: string;
  customer1: string;
  reply: string;
  catalogTitle: string;
  catalogSubtitle: string;
  catalogButton: string;
  customer2: string;
  typing: string;
  composer: string;
  leadMoved: string;
  campaignTitle: string;
  campaignSchedule: string;
  sent: string;
  delivered: string;
  read: string;
  quality: string;
};

/*
 * Timeline (one step per phase):
 * 0 empty → 1 customer asks → 2 agent types the reply in the composer →
 * 3 reply + catalog sent → 4 customer typing → 5 customer replies →
 * 6 lead moved + campaign card → (hold) → loop.
 */
const FINAL_STEP = 6;
const STEP_DELAYS = [600, 1200, 0, 1400, 1300, 1200, 5200];
const TYPE_INTERVAL_MS = 34;

const pop = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export default function HeroMockup({ strings }: { strings: HeroMockupStrings }) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState(0);
  const [active, setActive] = useState(true);

  const replyChars = Array.from(strings.reply);
  const showFinal = reduceMotion === true;
  const current = showFinal ? FINAL_STEP : step;

  // Pause while off-screen or when the tab is hidden, to save battery and CPU.
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    let visible = true;
    const update = () => setActive(visible && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // Typing: reveal the agent's reply one character at a time.
  useEffect(() => {
    if (showFinal || !active || step !== 2) return;
    if (typed >= replyChars.length) {
      const timer = window.setTimeout(() => setStep(3), 450);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setTyped((count) => count + 1), TYPE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [showFinal, active, step, typed, replyChars.length]);

  // Advance through the other steps on a timer, looping at the end.
  useEffect(() => {
    if (showFinal || !active || step === 2) return;
    const timer = window.setTimeout(() => {
      if (step >= FINAL_STEP) {
        setTyped(0);
        setStep(0);
      } else {
        setStep(step + 1);
      }
    }, STEP_DELAYS[step]);
    return () => window.clearTimeout(timer);
  }, [showFinal, active, step]);

  const composerText = current === 2 ? replyChars.slice(0, typed).join("") : "";

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[22rem] pb-24 sm:pb-16">
      {/* Phone */}
      <div className="relative overflow-hidden rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl shadow-slate-900/20 dark:border-slate-700">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white dark:bg-[#1f2c34]">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
            {Array.from(strings.business)[0]}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{strings.business}</span>
            <span className="block text-xs text-white/80">{strings.status}</span>
          </span>
        </div>

        <div className="flex h-[23rem] flex-col justify-end gap-2 bg-wa-wallpaper px-3 py-3">
          <span className="mx-auto mb-auto rounded-md bg-white/80 px-2 py-0.5 text-[11px] text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-300">
            {strings.today}
          </span>
          <AnimatePresence initial={false}>
            {current >= 1 ? (
              <m.div key="c1" {...pop}>
                <Bubble side="in">{strings.customer1}</Bubble>
              </m.div>
            ) : null}
            {current >= 3 ? (
              <m.div key="reply" {...pop} className="flex flex-col gap-2">
                <Bubble side="out">
                  {strings.reply}
                  <CheckCheckIcon
                    className="ms-1 inline size-3.5 text-sky-600"
                    aria-hidden="true"
                  />
                </Bubble>
                <div className="ms-auto w-[78%] overflow-hidden rounded-xl bg-wa-out shadow-sm">
                  <div className="h-16 bg-gradient-to-br from-sky-200 via-rose-200 to-amber-200 dark:from-sky-800 dark:via-rose-800 dark:to-amber-800" />
                  <div className="px-3 py-2">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">
                      {strings.catalogTitle}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      {strings.catalogSubtitle}
                    </p>
                  </div>
                  <p className="flex items-center justify-center gap-1.5 border-t border-black/10 py-2 text-[13px] font-medium text-sky-700 dark:border-white/10 dark:text-sky-300">
                    <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                    {strings.catalogButton}
                  </p>
                </div>
              </m.div>
            ) : null}
            {current === 4 ? (
              <m.div key="typing" {...pop}>
                <Bubble side="in" className="inline-flex gap-1 py-3">
                  <TypingDots />
                </Bubble>
              </m.div>
            ) : null}
            {current >= 5 ? (
              <m.div key="c2" {...pop}>
                <Bubble side="in">{strings.customer2}</Bubble>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 bg-wa-wallpaper px-2 pb-2">
          <span className="flex min-h-10 flex-1 items-center rounded-full bg-white px-4 text-[13px] dark:bg-[#2a3942]">
            {composerText ? (
              <span className="line-clamp-1 text-slate-900 dark:text-slate-50">
                {composerText}
                <span className="ms-px inline-block h-4 w-px animate-pulse bg-slate-900 align-middle dark:bg-slate-50" />
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">{strings.composer}</span>
            )}
          </span>
          <span className="flex size-10 items-center justify-center rounded-full bg-[#00a884] text-white">
            <SendIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Lead badge */}
      <AnimatePresence>
        {current >= 6 ? (
          <m.div
            key="lead"
            {...pop}
            className="absolute -end-2 -top-4 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground shadow-lg sm:-end-10"
          >
            <TrendingUpIcon className="size-4 text-brand" aria-hidden="true" />
            {strings.leadMoved}
          </m.div>
        ) : null}
      </AnimatePresence>

      {/* Campaign card */}
      <AnimatePresence>
        {current >= 6 ? (
          <m.div
            key="campaign"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -end-2 bottom-0 w-60 rounded-xl border bg-card p-3 text-card-foreground shadow-xl sm:-end-16"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{strings.campaignTitle}</p>
              <ShieldCheckIcon className="size-4 text-brand" aria-hidden="true" />
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ClockIcon className="size-3" aria-hidden="true" />
              {strings.campaignSchedule}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {[
                { label: strings.sent, width: 1, tone: "bg-slate-400" },
                { label: strings.delivered, width: 0.94, tone: "bg-sky-500" },
                { label: strings.read, width: 0.78, tone: "bg-brand" },
              ].map((row, i) => (
                <div key={row.label} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
                  <span className="text-[11px]">{row.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <m.span
                      className="mock-grow block h-full rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: row.width }}
                      transition={{ duration: 0.9, delay: 0.45 + i * 0.15, ease: "easeOut" }}
                    >
                      <span className={cn("block h-full w-full rounded-full", row.tone)} />
                    </m.span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-medium text-success">{strings.quality}</p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Bubble({
  side,
  children,
  className,
}: {
  side: "in" | "out";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-fit max-w-[82%] rounded-xl px-3 py-2 text-[13px] leading-snug text-slate-900 shadow-sm dark:text-slate-50",
        side === "out" ? "ms-auto rounded-se-sm bg-wa-out" : "me-auto rounded-ss-sm bg-wa-in",
        className,
      )}
    >
      {children}
    </div>
  );
}

function TypingDots() {
  return (
    <>
      {[0, 1, 2].map((dot) => (
        <m.span
          key={dot}
          className="size-1.5 rounded-full bg-slate-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
        />
      ))}
    </>
  );
}

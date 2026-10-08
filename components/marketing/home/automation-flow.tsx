"use client";

import {
  BellRingIcon,
  CircleCheckIcon,
  HourglassIcon,
  SendIcon,
  SplitIcon,
  ZapIcon,
} from "lucide-react";
import { m, useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AutomationFlowStrings = {
  label: string;
  nodes: { trigger: string; wait: string; send: string; check: string; yes: string; no: string };
  kinds: { trigger: string; wait: string; send: string; check: string };
};

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * "Customer became interested → wait 1 day → send template → replied? yes/no".
 * Nodes appear one by one and connectors draw in (scaleY from the top), then a pulse
 * travels down the chain. Transform/opacity only; static for reduced motion.
 */
export function AutomationFlow({ strings }: { strings: AutomationFlowStrings }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion() === true;
  const shown = reduce || inView;

  const chain = [
    { key: "trigger", icon: ZapIcon, kind: strings.kinds.trigger, text: strings.nodes.trigger },
    { key: "wait", icon: HourglassIcon, kind: strings.kinds.wait, text: strings.nodes.wait },
    { key: "send", icon: SendIcon, kind: strings.kinds.send, text: strings.nodes.send },
    { key: "check", icon: SplitIcon, kind: strings.kinds.check, text: strings.nodes.check },
  ] as const;

  const nodeDelay = (index: number) => (reduce ? 0 : index * 0.45);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={strings.label}
      className="relative mx-auto w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl shadow-slate-900/5 sm:p-6 dark:shadow-black/30"
    >
      <ol aria-hidden="true" className="flex flex-col items-stretch">
        {chain.map((node, index) => (
          <li key={node.key} className="flex flex-col items-center">
            <m.div
              className="w-full"
              initial={reduce ? false : { opacity: 0, y: 14, scale: 0.97 }}
              animate={shown ? { opacity: 1, y: 0, scale: 1 } : undefined}
              transition={{ duration: 0.45, delay: nodeDelay(index), ease }}
            >
              <FlowNode icon={<node.icon className="size-4" aria-hidden="true" />} kind={node.kind}>
                {node.text}
              </FlowNode>
            </m.div>
            {index < chain.length - 1 ? (
              <Connector shown={shown} reduce={reduce} delay={nodeDelay(index) + 0.3} />
            ) : null}
          </li>
        ))}
      </ol>

      <div aria-hidden="true" className="mt-0 grid grid-cols-2 gap-3">
        <BranchConnector shown={shown} reduce={reduce} delay={nodeDelay(3) + 0.3} />
        <BranchConnector shown={shown} reduce={reduce} delay={nodeDelay(3) + 0.3} />
        <m.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={shown ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, delay: nodeDelay(4), ease }}
          className="flex items-start gap-2 rounded-lg bg-accent p-3 text-xs font-medium text-accent-foreground sm:text-sm"
        >
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {strings.nodes.yes}
        </m.div>
        <m.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={shown ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, delay: nodeDelay(4) + 0.15, ease }}
          className="flex items-start gap-2 rounded-lg bg-amber-100 p-3 text-xs font-medium text-amber-950 sm:text-sm dark:bg-amber-950 dark:text-amber-100"
        >
          <BellRingIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {strings.nodes.no}
        </m.div>
      </div>
    </div>
  );
}

function FlowNode({
  icon,
  kind,
  children,
}: {
  icon: ReactNode;
  kind: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-accent-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {kind}
        </span>
        <span className="block text-sm font-medium">{children}</span>
      </span>
    </div>
  );
}

function Connector({ shown, reduce, delay }: { shown: boolean; reduce: boolean; delay: number }) {
  return (
    <span className="relative block h-7 w-0.5 overflow-hidden">
      <m.span
        className="absolute inset-0 origin-top bg-brand/60"
        initial={reduce ? false : { scaleY: 0 }}
        animate={shown ? { scaleY: 1 } : undefined}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
      />
      {!reduce && shown ? (
        <m.span
          className="absolute inset-x-0 top-0 h-2 rounded-full bg-brand"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: [-8, 28], opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, delay: delay + 1.6, repeat: Infinity, repeatDelay: 1.6 }}
        />
      ) : null}
    </span>
  );
}

function BranchConnector({
  shown,
  reduce,
  delay,
}: {
  shown: boolean;
  reduce: boolean;
  delay: number;
}) {
  return (
    <span className={cn("relative mx-auto block h-6 w-0.5 overflow-hidden")}>
      <m.span
        className="absolute inset-0 origin-top bg-brand/60"
        initial={reduce ? false : { scaleY: 0 }}
        animate={shown ? { scaleY: 1 } : undefined}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
      />
    </span>
  );
}

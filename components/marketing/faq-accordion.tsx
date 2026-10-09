"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type FaqEntry = { id: string; question: string; answer: string };

type FaqAccordionProps = {
  items: FaqEntry[];
  className?: string;
  /** Controlled open items (optional). */
  value?: string[];
  onValueChange?: (value: string[]) => void;
};

/**
 * Accessible FAQ list (Radix accordion: buttons with aria-expanded, arrow-key support).
 * Panels are force-mounted and hidden with CSS, so answers are in the HTML for search
 * engines and the browser's find-in-page.
 */
export function FaqAccordion({ items, className, value, onValueChange }: FaqAccordionProps) {
  const controlled = value !== undefined ? { value, onValueChange } : {};
  return (
    <Accordion type="multiple" {...controlled} className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          id={`faq-${item.id}`}
          className="scroll-mt-24 rounded-xl border bg-card px-5 shadow-card transition-[border-color,box-shadow] duration-200 last:border-b hover:border-foreground/15 data-[state=open]:border-brand/30 data-[state=open]:shadow-lift"
        >
          <AccordionTrigger className="text-start text-base font-semibold">
            {item.question}
          </AccordionTrigger>
          <AccordionContent forceMount className="text-base leading-relaxed text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

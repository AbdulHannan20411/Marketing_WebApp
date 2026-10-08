import { ArrowUpRightIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

type CtaBandProps = {
  title: string;
  subtitle: string;
  /** External link into the NextReach app (free trial). */
  primary?: { label: string; href: string };
  /** Internal link, e.g. /contact. */
  secondary?: { label: string; href: string };
};

/** Closing call-to-action block used at the bottom of pages. */
export function CtaBand({ title, subtitle, primary, secondary }: CtaBandProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <Reveal className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -start-16 -bottom-28 size-72 rounded-full bg-black/10 blur-2xl"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
            <p className="text-lg text-pretty opacity-90">{subtitle}</p>
            <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {primary ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <a href={primary.href}>
                    {primary.label}
                    <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
              {secondary ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link href={secondary.href}>{secondary.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

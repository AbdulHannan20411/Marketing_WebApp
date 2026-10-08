import { ArrowUpRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { appLinks } from "@/lib/site";

// Phase 1 holding hero. Phase 2 replaces this with the full animated home page.
export default async function HomePage() {
  const t = await getTranslations("home.hero");

  return (
    <section className="container-page flex flex-col items-center py-20 text-center md:py-28">
      <p className="rounded-full border bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
        {t("eyebrow")}
      </p>
      <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="lg">
          <a href={appLinks.startTrial}>
            {t("primaryCta")}
            <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/features">{t("secondaryCta")}</Link>
        </Button>
      </div>
    </section>
  );
}

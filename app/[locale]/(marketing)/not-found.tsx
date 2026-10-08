import { ArrowRightIcon, CompassIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/** Localised 404, rendered inside the marketing layout (header and footer included). */
export default async function NotFound() {
  const [t, nav] = await Promise.all([getTranslations("errors.notFound"), getTranslations("nav")]);
  const links = [
    { href: "/features", label: nav("features") },
    { href: "/pricing", label: nav("pricing") },
    { href: "/faq", label: nav("faq") },
    { href: "/contact", label: nav("contact") },
  ];

  return (
    <section className="container-page flex flex-col items-center py-20 text-center sm:py-28">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft text-accent-foreground">
        <CompassIcon className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-widest text-primary">{t("code")}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">{t("description")}</p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">{t("home")}</Link>
      </Button>
      <nav aria-label={t("links")} className="mt-10 w-full max-w-md">
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-center justify-between rounded-xl border bg-card px-4 py-3 font-medium transition-colors hover:border-brand/50"
              >
                {link.label}
                <ArrowRightIcon
                  className="size-4 text-muted-foreground rtl:rotate-180"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

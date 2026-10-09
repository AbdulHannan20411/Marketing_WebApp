import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

/** "Showing 26–50 of 120" with previous/next links. Renders nothing for one page. */
export async function Pagination({
  page,
  pageSize,
  total,
  href,
  locale,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** The link for a page number. */
  href: (page: number) => string;
  locale: string;
}) {
  const t = await getTranslations("admin.inbox");
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const number = new Intl.NumberFormat(locale === "ur" ? "ur-PK" : "en-PK");
  const from = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + 1);
  const to = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label={t("pagination")}
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
    >
      <p>
        {t("showing", {
          from: number.format(from),
          to: number.format(to),
          total: number.format(total),
        })}
      </p>
      {pages > 1 ? (
        <div className="flex items-center gap-2">
          <span>{t("page", { page: number.format(page), pages: number.format(pages) })}</span>
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href(page - 1)} rel="prev">
                <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
                {t("previous")}
              </Link>
            </Button>
          ) : null}
          {page < pages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={href(page + 1)} rel="next">
                {t("next")}
                <ChevronRightIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

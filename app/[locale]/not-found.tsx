import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NotFoundContent } from "@/components/marketing/not-found-content";

/**
 * 404 for notFound() outside the marketing pages (account and admin areas), with the
 * site header and footer.
 */
export default function LocaleNotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}

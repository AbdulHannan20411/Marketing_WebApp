import { renderOgImage } from "@/lib/og/og-image";
import { locales } from "@/lib/i18n/routing";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function Image({ params }: { params: Promise<{ locale: string }> }) {
  return renderOgImage(params, "useCases");
}

import { notFound } from "next/navigation";

import { featureSlugs, isFeatureSlug } from "@/content/feature-slugs";
import { locales } from "@/lib/i18n/routing";
import { renderOgImage } from "@/lib/og/og-image";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return locales.flatMap((locale) => featureSlugs.map((slug) => ({ locale, slug })));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, ...rest } = await params;
  if (!isFeatureSlug(slug)) notFound();
  return renderOgImage(Promise.resolve(rest), { feature: slug });
}

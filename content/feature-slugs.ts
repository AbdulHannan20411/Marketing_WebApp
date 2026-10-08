/**
 * Feature detail page slugs. Kept free of other imports so the proxy can use it
 * without pulling in icons or page content.
 */
export const featureSlugs = [
  "whatsapp-campaigns",
  "inbox",
  "crm-discovery",
  "sales-leads",
  "ai",
  "automations",
] as const;
export type FeatureSlug = (typeof featureSlugs)[number];

export function isFeatureSlug(value: string): value is FeatureSlug {
  return (featureSlugs as readonly string[]).includes(value);
}

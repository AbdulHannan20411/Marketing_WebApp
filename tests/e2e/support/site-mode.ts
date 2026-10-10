/**
 * Whether the build under test links to the main NextReach app or runs on its own
 * (NEXT_PUBLIC_APP_URL empty). Read from the same .env.local the build used.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // CI provides the variables directly.
}

export const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || null;
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
).replace(/\/$/, "");

/** Where plan buttons lead: the app's pricing pages, or the query form. */
export const expectedPricingHref = appUrl
  ? new URL("/pricing", appUrl).toString()
  : "/en/contact?topic=pricing";
export const expectedCustomPlanHref = appUrl
  ? new URL("/pricing/custom", appUrl).toString()
  : "/en/contact?topic=pricing";

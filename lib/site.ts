import { BRAND_NAME } from "@/lib/brand";
import { publicEnv } from "@/lib/env/public";

/** Non-translatable site constants. All human-readable copy lives in `messages/`. */
export const siteConfig = {
  name: BRAND_NAME,
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
} as const;

/**
 * Links into the main NextReach app, or null while it isn't live.
 *
 * Until NEXT_PUBLIC_APP_URL is set the site runs on its own: "Start free trial"
 * opens the query form (so every lead lands in the admin inbox), app sign-in links
 * are hidden, and plan buttons go to the contact form. Setting the variable (and
 * redeploying) switches every link to the app; no code changes needed.
 * Sign-in and sign-up both use the app root until its exact paths are known.
 */
const appUrl = siteConfig.appUrl || null;
export const appLinks = {
  signIn: appUrl,
  startTrial: appUrl,
  pricing: appUrl ? new URL("/pricing", appUrl).toString() : null,
  customPlan: appUrl ? new URL("/pricing/custom", appUrl).toString() : null,
} as const;

import { publicEnv } from "@/lib/env/public";

/** Non-translatable site constants. All human-readable copy lives in `messages/`. */
export const siteConfig = {
  name: "NextReach",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
} as const;

/**
 * Links into the main NextReach app. This site never handles app accounts.
 * Both point at the app root until the app's sign-in / sign-up paths are confirmed;
 * change them here only.
 */
export const appLinks = {
  signIn: siteConfig.appUrl,
  startTrial: siteConfig.appUrl,
} as const;

/**
 * Optional analytics: Umami Cloud (cookieless). Nothing loads unless
 * NEXT_PUBLIC_ANALYTICS_ID (the Umami website ID) is set, and then only after the
 * visitor accepts the notice. Kept free of other imports so next.config.ts can use it.
 */
export const UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

/** Where the script is served from and where it sends events (for the CSP). */
export const UMAMI_ORIGINS = ["https://cloud.umami.is", "https://api-gateway.umami.dev"];

/** localStorage key for the visitor's choice. */
export const CONSENT_STORAGE_KEY = "nextreach-analytics-consent";
/** Window event that reopens the notice (footer "Cookie settings"). */
export const CONSENT_REOPEN_EVENT = "nextreach:consent-reopen";

export type ConsentChoice = "granted" | "denied";

export function readConsent(storage: Pick<Storage, "getItem"> | undefined): ConsentChoice | null {
  try {
    const value = storage?.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null; // Storage blocked: ask again; nothing loads until accepted.
  }
}

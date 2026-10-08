import type messages from "./messages/en.json";
import type { routing } from "./lib/i18n/routing";

// Type-safe translation keys and locales for next-intl. `en.json` is the source of truth;
// a unit test asserts that `ur.json` has exactly the same keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}

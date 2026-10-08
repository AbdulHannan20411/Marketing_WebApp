import type { Messages } from "next-intl";

/** Namespaces every page's Client Components need (header, menus, errors). */
export const BASE_CLIENT_NAMESPACES = ["common", "nav", "cta", "errors"] as const;

/** Picks top-level namespaces to send to the browser; everything else stays on the server. */
export function pickMessages<const K extends keyof Messages>(
  messages: Messages,
  namespaces: readonly K[],
): Pick<Messages, K> {
  return Object.fromEntries(
    namespaces.map((namespace) => [namespace, messages[namespace]]),
  ) as Pick<Messages, K>;
}

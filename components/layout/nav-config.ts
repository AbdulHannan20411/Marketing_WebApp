/** Locale-less hrefs; the next-intl `Link` adds the /en or /ur prefix. */
export const primaryNav = [
  { key: "features", href: "/features" },
  { key: "pricing", href: "/pricing" },
  { key: "useCases", href: "/use-cases" },
  { key: "about", href: "/about" },
  { key: "faq", href: "/faq" },
  { key: "contact", href: "/contact" },
] as const;

export type PrimaryNavKey = (typeof primaryNav)[number]["key"];

export const footerNav = {
  product: [
    { key: "features", href: "/features" },
    { key: "pricing", href: "/pricing" },
    { key: "useCases", href: "/use-cases" },
  ],
  company: [
    { key: "about", href: "/about" },
    { key: "contact", href: "/contact" },
    { key: "faq", href: "/faq" },
    { key: "account", href: "/account" },
  ],
  legal: [
    { key: "privacy", href: "/privacy" },
    { key: "terms", href: "/terms" },
    { key: "refund", href: "/refund-policy" },
  ],
} as const;

/** True when `pathname` (without locale) is `href` or one of its children. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

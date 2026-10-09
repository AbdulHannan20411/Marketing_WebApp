/**
 * Security headers applied to every response from `next.config.ts`.
 *
 * The CSP is static (no nonces) so pages keep their prerendered static shell. That
 * means `script-src` needs 'unsafe-inline' for Next.js' inline RSC payload and the
 * no-flash theme script. Everything else is locked down: no plugins, no framing,
 * no foreign form targets, and network access only to the services we use.
 */

export type SecurityHeaderOptions = {
  isDev: boolean;
  supabaseUrl?: string;
  /** Analytics origins (Umami), only when analytics is configured. */
  analyticsOrigins?: string[];
};

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function buildContentSecurityPolicy({
  isDev,
  supabaseUrl,
  analyticsOrigins = [],
}: SecurityHeaderOptions): string {
  const supabase = originOf(supabaseUrl);
  const supabaseWs = supabase?.replace(/^http/, "ws");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      // React uses eval for richer error stacks in development only.
      ...(isDev ? ["'unsafe-eval'"] : []),
      TURNSTILE_ORIGIN,
      ...analyticsOrigins,
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...(supabase ? [supabase] : [])],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      ...(supabase ? [supabase] : []),
      ...(supabaseWs ? [supabaseWs] : []),
      TURNSTILE_ORIGIN,
      ...analyticsOrigins,
      ...(isDev ? ["ws:"] : []),
    ],
    "frame-src": [TURNSTILE_ORIGIN],
    "worker-src": ["'self'", "blob:"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
  };

  const policy = Object.entries(directives).map(
    ([name, values]) => `${name} ${Array.from(new Set(values)).join(" ")}`,
  );
  if (!isDev) policy.push("upgrade-insecure-requests");

  return policy.join("; ");
}

export function buildSecurityHeaders(
  options: SecurityHeaderOptions,
): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    // Two years, the minimum for the HSTS preload list. Browsers ignore it on http://localhost.
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Legacy equivalent of frame-ancestors 'none' for older browsers.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
  ];
}

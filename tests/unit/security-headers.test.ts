import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/security/headers";

function directive(csp: string, name: string): string[] {
  const entry = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `) || part === name);
  return entry ? entry.split(/\s+/).slice(1) : [];
}

describe("content security policy", () => {
  const prod = buildContentSecurityPolicy({
    isDev: false,
    supabaseUrl: "https://abc.supabase.co/",
  });

  it("forbids framing, plugins and foreign form targets", () => {
    expect(directive(prod, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(prod, "object-src")).toEqual(["'none'"]);
    expect(directive(prod, "form-action")).toEqual(["'self'"]);
    expect(directive(prod, "base-uri")).toEqual(["'self'"]);
  });

  it("allows Supabase over https and websockets (realtime)", () => {
    expect(directive(prod, "connect-src")).toEqual(
      expect.arrayContaining(["https://abc.supabase.co", "wss://abc.supabase.co"]),
    );
  });

  it("never allows eval in production, only in development", () => {
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
    const dev = buildContentSecurityPolicy({ isDev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
  });

  it("upgrades insecure requests in production only", () => {
    expect(prod).toContain("upgrade-insecure-requests");
    expect(buildContentSecurityPolicy({ isDev: true })).not.toContain("upgrade-insecure-requests");
  });

  it("ignores an invalid Supabase URL instead of producing a broken policy", () => {
    const csp = buildContentSecurityPolicy({ isDev: false, supabaseUrl: "not a url" });
    expect(directive(csp, "connect-src")).not.toContain("not");
  });
});

describe("security headers", () => {
  const headers = Object.fromEntries(
    buildSecurityHeaders({ isDev: false }).map(({ key, value }) => [key, value]),
  );

  it("sets the required hardening headers", () => {
    expect(headers["Strict-Transport-Security"]).toMatch(/max-age=\d{8,}/);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });
});

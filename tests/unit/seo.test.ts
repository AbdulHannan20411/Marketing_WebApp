import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { featureSlugs } from "@/content/feature-slugs";
import { CONSENT_STORAGE_KEY, readConsent, UMAMI_ORIGINS } from "@/lib/analytics";
import { buildContentSecurityPolicy } from "@/lib/security/headers";
import { publicPaths } from "@/lib/seo";
import {
  faqPageJsonLd,
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "@/lib/structured-data";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists every public page in both languages", () => {
    expect(entries).toHaveLength(publicPaths.length * 2);
    const urls = entries.map((entry) => new URL(entry.url).pathname);
    expect(urls).toEqual(expect.arrayContaining(["/en", "/ur", "/en/pricing", "/ur/faq"]));
    for (const slug of featureSlugs) expect(urls).toContain(`/en/features/${slug}`);
  });

  it("never lists private areas", () => {
    const urls = entries.map((entry) => entry.url).join(" ");
    expect(urls).not.toMatch(/\/(account|admin|sign-in|sign-up|api)\b/);
  });

  it("gives each page hreflang alternates with an English x-default", () => {
    const pricing = entries.find((entry) => entry.url.endsWith("/ur/pricing"))!;
    const languages = pricing.alternates?.languages as Record<string, string>;
    expect(new URL(languages.en!).pathname).toBe("/en/pricing");
    expect(new URL(languages.ur!).pathname).toBe("/ur/pricing");
    expect(new URL(languages["x-default"]!).pathname).toBe("/en/pricing");
  });
});

describe("robots.txt", () => {
  it("allows the site, blocks private areas in both languages and links the sitemap", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0]! : result.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(
      expect.arrayContaining(["/api/", "/en/account", "/ur/account", "/en/admin", "/ur/admin"]),
    );
    expect(String(result.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});

describe("structured data", () => {
  it("describes the organisation without invented contact details", () => {
    const org = organizationJsonLd({ siteUrl: "https://growbusinesss.com", description: "WhatsApp" });
    expect(org).toMatchObject({
      "@type": "Organization",
      name: "GrowBusinesss",
      url: "https://growbusinesss.com",
      logo: "https://growbusinesss.com/icon.svg",
    });
    expect(org).not.toHaveProperty("telephone");
    expect(org).not.toHaveProperty("sameAs");
  });

  it("links the website to the organisation", () => {
    const site = websiteJsonLd({
      siteUrl: "https://growbusinesss.com",
      pageUrl: "https://growbusinesss.com/ur",
      name: "GrowBusinesss",
      language: "ur",
    });
    expect(site.publisher["@id"]).toBe("https://growbusinesss.com/#organization");
    expect(site.inLanguage).toBe("ur");
  });

  it("builds an FAQPage from the questions on the page", () => {
    expect(faqPageJsonLd([{ question: "Q?", answer: "A." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
      ],
    });
  });

  it("can't break out of its script tag", () => {
    expect(serializeJsonLd({ text: "</script><script>alert(1)</script>" })).not.toContain("</");
  });
});

describe("analytics consent", () => {
  const storage = (value: string | null) => ({ getItem: () => value });

  it("only treats an explicit choice as a decision", () => {
    expect(readConsent(storage("granted"))).toBe("granted");
    expect(readConsent(storage("denied"))).toBe("denied");
    expect(readConsent(storage("maybe"))).toBeNull();
    expect(readConsent(storage(null))).toBeNull();
    expect(readConsent(undefined)).toBeNull();
  });

  it("asks again when storage is blocked", () => {
    expect(
      readConsent({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBeNull();
    expect(CONSENT_STORAGE_KEY).toBeTruthy();
  });

  it("adds Umami to the CSP only when analytics is on", () => {
    const off = buildContentSecurityPolicy({ isDev: false });
    const on = buildContentSecurityPolicy({ isDev: false, analyticsOrigins: UMAMI_ORIGINS });
    expect(off).not.toContain("umami");
    for (const origin of UMAMI_ORIGINS) expect(on).toContain(origin);
  });
});

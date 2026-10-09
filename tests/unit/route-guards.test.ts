import { describe, expect, it } from "vitest";

import { isUnknownDynamicPath, notFoundRewritePath } from "@/lib/i18n/route-guards";

describe("isUnknownDynamicPath", () => {
  it("accepts real feature pages and the features index", () => {
    expect(isUnknownDynamicPath("/en/features")).toBe(false);
    expect(isUnknownDynamicPath("/en/features/")).toBe(false);
    expect(isUnknownDynamicPath("/ur/features/inbox")).toBe(false);
    expect(isUnknownDynamicPath("/en/features/whatsapp-campaigns")).toBe(false);
  });

  it("flags unknown slugs and extra segments", () => {
    expect(isUnknownDynamicPath("/en/features/not-a-feature")).toBe(true);
    expect(isUnknownDynamicPath("/ur/features/inbox/extra")).toBe(true);
    expect(isUnknownDynamicPath("/en/features/inbox/opengraph-image/x")).toBe(true);
    expect(isUnknownDynamicPath("/en/features/nope/opengraph-image")).toBe(true);
  });

  it("lets a feature page's generated social image through", () => {
    expect(isUnknownDynamicPath("/en/features/inbox/opengraph-image")).toBe(false);
    expect(isUnknownDynamicPath("/ur/features/ai/opengraph-image-1a2b3c")).toBe(false);
  });

  it("ignores other routes", () => {
    expect(isUnknownDynamicPath("/en/pricing")).toBe(false);
    expect(isUnknownDynamicPath("/fr/features/whatever")).toBe(false);
    expect(isUnknownDynamicPath("/")).toBe(false);
  });

  it("rewrites to the catch-all in the same locale", () => {
    expect(notFoundRewritePath("/ur/features/x")).toBe("/ur/_not-found");
  });
});

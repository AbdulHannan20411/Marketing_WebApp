import { describe, expect, it } from "vitest";

import { isActivePath } from "@/components/layout/nav-config";
import { getDirection, isLocale, localeMeta } from "@/lib/i18n/routing";

describe("isActivePath", () => {
  it("matches the page and its children", () => {
    expect(isActivePath("/features", "/features")).toBe(true);
    expect(isActivePath("/features/crm", "/features")).toBe(true);
  });

  it("does not match siblings that share a prefix", () => {
    expect(isActivePath("/features-old", "/features")).toBe(false);
  });

  it("matches home only exactly", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/pricing", "/")).toBe(false);
  });
});

describe("locales", () => {
  it("renders Urdu right-to-left and English left-to-right", () => {
    expect(getDirection("ur")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
    expect(localeMeta.ur.htmlLang).toBe("ur");
  });

  it("recognises only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ur")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

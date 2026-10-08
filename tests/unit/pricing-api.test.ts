import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { fallbackPlans } from "@/content/fallback-plans";
import { fetchResource } from "@/lib/pricing/fetch-resource";
import {
  formatLimit,
  formatMoney,
  formatSearchRadius,
  formatStorage,
  yearlySavingPercent,
  type LimitLabels,
} from "@/lib/pricing/format";
import { customPlanOfferSchema, planSchema } from "@/lib/pricing/schemas";

const BASE = "https://api.example.com";
const plansSchema = z.array(planSchema);

const apiPlan = {
  id: "plan_3",
  name: "Growth",
  tagline: "For growing teams",
  monthlyPrice: 4500,
  yearlyPrice: 45000,
  currency: "PKR",
  trialDays: 14,
  renewalPeriodMonths: 1,
  discountPercent: 0,
  isPromotional: false,
  isMostPopular: true,
  isRecommended: false,
  status: "active",
  supportLevel: "email",
  modules: {
    whatsapp: true,
    email: false,
    social: false,
    crm: true,
    sales: true,
    leads: true,
    automations: true,
    reporting: true,
    ai: false,
    lead_scoring: false,
    api: false,
    employees: true,
  },
  limits: {
    maxEmployees: 5,
    maxContacts: 10000,
    maxCampaigns: null,
    maxWhatsAppAccounts: 1,
    maxEmailAccounts: 0,
    maxSocialAccounts: 0,
    maxApiCallsPerMonth: 0,
    maxStorageMb: 5120,
    dailyMessageLimit: 1000,
    monthlyMessageLimit: 20000,
    monthlyAiReplyLimit: 0,
    maxSearchRadiusKm: 5,
    maxActiveAutomations: 3,
  },
  highlights: ["Shared inbox", "Catalog links"],
  sortOrder: 2,
  updatedAt: "2026-10-08T10:00:00+00:00",
  autoReplyTriggers: { greeting: true, first_message: false, unanswered: false },
  isCustom: false,
  ownerOrganisation: null,
};

const customOffer = {
  enabled: true,
  currency: "PKR",
  startingMonthlyPrice: 3000,
  startingYearlyPrice: 30600,
  yearlyDiscountPercent: 15,
  trialDays: 14,
  includedModules: ["whatsapp", "crm"],
  modulePrices: { sales: 1500, leads: 1000 },
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function envelope(data: unknown) {
  return { data, message: null, traceId: "00-abc" };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchResource (pricing API client)", () => {
  it("parses a successful plans response and unwraps data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope([apiPlan])));
    const result = await fetchResource(plansSchema, {
      baseUrl: BASE,
      path: "/api/v1/public/plans",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `${BASE}/api/v1/public/plans`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]?.name).toBe("Growth");
      expect(result.data[0]?.limits.maxCampaigns).toBeNull();
    }
  });

  it("treats an empty list as success with no plans", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope([])));
    const result = await fetchResource(plansSchema, { baseUrl: BASE, path: "/x", fetchImpl });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("parses a disabled custom plan offer", async () => {
    const disabled = {
      ...customOffer,
      enabled: false,
      startingMonthlyPrice: 0,
      startingYearlyPrice: 0,
      includedModules: [],
      modulePrices: {},
    };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope(disabled)));
    const result = await fetchResource(customPlanOfferSchema, {
      baseUrl: BASE,
      path: "/x",
      fetchImpl,
    });
    expect(result.ok && result.data.enabled).toBe(false);
  });

  it("fails gracefully on a non-2xx problem response and logs the traceId", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const problem = {
      type: "about:blank",
      title: "Too Many Requests",
      status: 429,
      traceId: "00-trace",
    };
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(problem, {
        status: 429,
        headers: { "content-type": "application/problem+json" },
      }),
    );
    const result = await fetchResource(plansSchema, { baseUrl: BASE, path: "/x", fetchImpl });

    expect(result).toEqual({ ok: false, reason: "http_error" });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[1]).toMatchObject({ status: 429, traceId: "00-trace" });
  });

  it("reports a timeout", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });
    });
    const result = await fetchResource(plansSchema, {
      baseUrl: BASE,
      path: "/x",
      fetchImpl,
      timeoutMs: 20,
    });
    expect(result).toEqual({ ok: false, reason: "timeout" });
  });

  it("reports a network failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const result = await fetchResource(plansSchema, { baseUrl: BASE, path: "/x", fetchImpl });
    expect(result).toEqual({ ok: false, reason: "network" });
  });

  it("reports malformed JSON", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 200 }));
    const result = await fetchResource(plansSchema, { baseUrl: BASE, path: "/x", fetchImpl });
    expect(result).toEqual({ ok: false, reason: "invalid_json" });
  });

  it("still parses when the API adds unknown fields", async () => {
    const withExtra = {
      ...apiPlan,
      brandNewField: { nested: true },
      limits: { ...apiPlan.limits, maxSomethingNew: 7 },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ...envelope([withExtra]), extra: 1 }));
    const result = await fetchResource(plansSchema, { baseUrl: BASE, path: "/x", fetchImpl });
    expect(result.ok).toBe(true);
  });

  it("rejects a response missing a field the site uses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { monthlyPrice: _omit, ...broken } = apiPlan;
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(envelope([broken])));
    const result = await fetchResource(plansSchema, { baseUrl: BASE, path: "/x", fetchImpl });
    expect(result).toEqual({ ok: false, reason: "schema_mismatch" });
  });

  it("does not call the network when the API is not configured", async () => {
    const fetchImpl = vi.fn();
    const result = await fetchResource(plansSchema, { baseUrl: undefined, path: "/x", fetchImpl });
    expect(result).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("fallback plans", () => {
  it("match the plan schema", () => {
    expect(() => plansSchema.parse(fallbackPlans)).not.toThrow();
  });
});

describe("pricing formatting", () => {
  const labels: LimitLabels = {
    unlimited: "Unlimited",
    notIncluded: "Not included",
    gb: (v) => `${v} GB`,
    mb: (v) => `${v} MB`,
    km: (v) => `${v} km`,
    upToKm: (v) => `Up to ${v} km`,
  };

  it("renders a null limit as Unlimited", () => {
    expect(formatLimit("en", null, labels)).toBe("Unlimited");
    expect(formatLimit("en", 10000, labels)).toBe("10,000");
  });

  it("formats money with the currency code and no decimals", () => {
    // Intl joins the code and amount with a no-break space so they never wrap apart.
    expect(formatMoney("en", 4500, "PKR")).toBe("PKR 4,500");
  });

  it("shows storage in GB when divisible by 1024", () => {
    expect(formatStorage("en", 5120, labels)).toBe("5 GB");
    expect(formatStorage("en", 500, labels)).toBe("500 MB");
    expect(formatStorage("en", null, labels)).toBe("Unlimited");
  });

  it("handles the search radius rules", () => {
    expect(formatSearchRadius("en", 0, labels)).toBe("Not included");
    expect(formatSearchRadius("en", null, labels)).toBe("Up to 10 km");
    expect(formatSearchRadius("en", 5, labels)).toBe("5 km");
  });

  it("computes the yearly saving only when yearly is cheaper", () => {
    expect(yearlySavingPercent({ monthlyPrice: 4500, yearlyPrice: 45000 })).toBe(17);
    expect(yearlySavingPercent({ monthlyPrice: 1000, yearlyPrice: 12000 })).toBe(0);
    expect(yearlySavingPercent({ monthlyPrice: 0, yearlyPrice: 0 })).toBe(0);
  });
});

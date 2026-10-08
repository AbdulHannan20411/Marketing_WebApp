import { describe, expect, it } from "vitest";

import { fallbackPlans } from "@/content/fallback-plans";
import type { CustomPlanOffer, Plan } from "@/lib/pricing/schemas";
import {
  buildComparison,
  buildCustomPlanCard,
  buildPlanCard,
  enabledModules,
  maxYearlySaving,
  type PricingLabels,
} from "@/lib/pricing/view-model";
import { productJsonLd, serializeJsonLd } from "@/lib/structured-data";

const NBSP = " ";

const labels: PricingLabels = {
  limits: {
    unlimited: "Unlimited",
    notIncluded: "Not included",
    gb: (v) => `${v} GB`,
    mb: (v) => `${v} MB`,
    km: (v) => `${v} km`,
    upToKm: (v) => `Up to ${v} km`,
  },
  module: (key) => `module:${key}`,
  limit: (row) => `limit:${row}`,
  support: (level) => `support:${level}`,
  autoReply: (key) => `auto:${key}`,
  perMonth: "/month",
  perYear: "/year",
  approxPerMonth: (price) => `≈ ${price}/month`,
  save: (percent) => `Save ${percent}%`,
  promo: (percent) => `${percent}% off`,
  trial: (days) => `${days} days free trial`,
  startTrial: "Start free trial",
  getStarted: "Get started",
  ctaLabel: (action, plan) => `${action} with the ${plan} plan`,
};

const growth = fallbackPlans[1] as Plan;
const business = fallbackPlans[2] as Plan;
const checkout = "https://app.example.com/pricing";

describe("plan cards", () => {
  it("shows monthly and yearly prices, the per-month equivalent and the saving", () => {
    const card = buildPlanCard(growth, "en", labels, checkout);
    expect(card.monthly).toEqual({ price: `PKR${NBSP}4,500`, period: "/month" });
    expect(card.yearly.price).toBe(`PKR${NBSP}45,000`);
    expect(card.yearly.perMonth).toBe(`≈ PKR${NBSP}3,750/month`);
    expect(card.yearly.saving).toBe("Save 17%");
  });

  it("hides the saving when yearly is not cheaper", () => {
    const card = buildPlanCard({ ...growth, yearlyPrice: 54000 }, "en", labels, checkout);
    expect(card.yearly.saving).toBeNull();
  });

  it("uses 'Start free trial' only when there is a trial, and links to the app", () => {
    expect(buildPlanCard(growth, "en", labels, checkout).cta).toEqual({
      label: "Start free trial",
      ariaLabel: "Start free trial with the Growth plan",
      href: checkout,
    });
    expect(buildPlanCard({ ...growth, trialDays: 0 }, "en", labels, checkout).cta.label).toBe(
      "Get started",
    );
    expect(buildPlanCard({ ...growth, trialDays: 0 }, "en", labels, checkout).trial).toBeNull();
  });

  it("shows badges and promotions", () => {
    expect(buildPlanCard(growth, "en", labels, checkout).badge).toBe("mostPopular");
    expect(buildPlanCard(business, "en", labels, checkout).badge).toBe("recommended");
    const promo = buildPlanCard(
      { ...growth, isPromotional: true, discountPercent: 20 },
      "en",
      labels,
      checkout,
    );
    expect(promo.promo).toBe("20% off");
  });

  it("lists auto-reply triggers only when AI is on", () => {
    expect(buildPlanCard(business, "en", labels, checkout).autoReplies).toEqual([
      "auto:greeting",
      "auto:first_message",
      "auto:unanswered",
    ]);
    // Growth has greeting: true but no AI module.
    expect(buildPlanCard(growth, "en", labels, checkout).autoReplies).toEqual([]);
  });

  it("ignores modules that are not launched (email, social, api)", () => {
    const plan = {
      ...growth,
      modules: { ...growth.modules, email: true, social: true, api: true },
    };
    expect(enabledModules(plan)).not.toContain("email");
    expect(enabledModules(plan)).toEqual([
      "whatsapp",
      "crm",
      "sales",
      "leads",
      "automations",
      "reporting",
      "employees",
    ]);
  });

  it("computes the best yearly saving across plans", () => {
    expect(maxYearlySaving(fallbackPlans)).toBe(17);
    expect(maxYearlySaving([])).toBe(0);
  });
});

describe("comparison table", () => {
  const table = buildComparison([growth, business], "en", labels);

  it("has one column per plan in order", () => {
    expect(table.columns.map((column) => column.name)).toEqual(["Growth", "Business"]);
  });

  it("lists modules, then limits in the brief's order, then support", () => {
    expect(table.groups.map((group) => group.key)).toEqual(["modules", "limits", "support"]);
    expect(table.groups[0]?.rows).toHaveLength(9);
    expect(table.groups[1]?.rows.map((row) => row.key)).toEqual([
      "contacts",
      "employees",
      "campaigns",
      "whatsappNumbers",
      "dailyMessages",
      "monthlyMessages",
      "aiReplies",
      "automations",
      "storage",
      "searchRadius",
    ]);
  });

  it("renders null limits as Unlimited and applies the storage and radius rules", () => {
    const limits = table.groups[1]?.rows ?? [];
    const row = (key: string) => limits.find((r) => r.key === key)?.cells;
    expect(row("campaigns")).toEqual([
      { kind: "text", value: "Unlimited" },
      { kind: "text", value: "Unlimited" },
    ]);
    expect(row("storage")).toEqual([
      { kind: "text", value: "5 GB" },
      { kind: "text", value: "20 GB" },
    ]);
    expect(row("searchRadius")).toEqual([
      { kind: "text", value: "5 km" },
      { kind: "text", value: "Up to 10 km" },
    ]);
  });

  it("marks modules with ticks and dashes", () => {
    const ai = table.groups[0]?.rows.find((r) => r.key === "ai");
    expect(ai?.cells).toEqual([
      { kind: "check", included: false },
      { kind: "check", included: true },
    ]);
  });
});

describe("custom plan card", () => {
  const offer: CustomPlanOffer = {
    enabled: true,
    currency: "PKR",
    startingMonthlyPrice: 3000,
    startingYearlyPrice: 30600,
    yearlyDiscountPercent: 15,
    trialDays: 14,
    includedModules: ["whatsapp", "crm", "email"],
    modulePrices: { reporting: 800, sales: 1500, mystery: 999, ai: 3000 },
  };

  it("is hidden when the offer is disabled", () => {
    expect(
      buildCustomPlanCard({ ...offer, enabled: false }, "en", labels, (p) => `+${p}/month`),
    ).toBeNull();
  });

  it("lists included modules and priced add-ons, skipping unknown keys, in site order", () => {
    const card = buildCustomPlanCard(offer, "en", labels, (p) => `+${p}/month`);
    expect(card?.monthlyPrice).toBe(`PKR${NBSP}3,000`);
    expect(card?.yearlyPrice).toBe(`PKR${NBSP}30,600`);
    expect(card?.alwaysIncluded).toEqual(["module:whatsapp", "module:crm"]);
    expect(card?.addOns.map((addOn) => addOn.key)).toEqual(["sales", "reporting", "ai"]);
    expect(card?.addOns[0]?.price).toBe(`+PKR${NBSP}1,500/month`);
  });
});

describe("Product JSON-LD", () => {
  it("has one Offer per plan with price, currency and url", () => {
    const data = productJsonLd({
      plans: fallbackPlans,
      name: "NextReach",
      description: "d",
      pageUrl: "https://example.com/en/pricing",
      offerUrl: checkout,
    });
    expect(data["@type"]).toBe("Product");
    expect(data.offers).toHaveLength(fallbackPlans.length);
    expect(data.offers[0]).toMatchObject({
      "@type": "Offer",
      price: 2500,
      priceCurrency: "PKR",
      url: checkout,
    });
  });

  it("escapes < so the JSON cannot close the script tag", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain(
      "</script>",
    );
  });
});

/**
 * Mock of the NextReach public pricing API for end-to-end tests.
 *
 *   GET  /api/v1/public/plans
 *   GET  /api/v1/public/custom-plan
 *   POST /__mode/{up|down|empty|custom-off}   switch behaviour (test control only)
 *
 * Starts in "down" mode so pages that don't opt in see the fallback.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 3999);
let mode = "down";

const modules = (overrides = {}) => ({
  whatsapp: true,
  email: false,
  social: false,
  crm: true,
  sales: false,
  leads: false,
  automations: false,
  reporting: true,
  ai: false,
  lead_scoring: false,
  api: false,
  employees: false,
  ...overrides,
});

const limits = (overrides = {}) => ({
  maxEmployees: 2,
  maxContacts: 3000,
  maxCampaigns: 20,
  maxWhatsAppAccounts: 1,
  maxEmailAccounts: 0,
  maxSocialAccounts: 0,
  maxApiCallsPerMonth: 0,
  maxStorageMb: 2048,
  dailyMessageLimit: 500,
  monthlyMessageLimit: 10000,
  monthlyAiReplyLimit: 0,
  maxSearchRadiusKm: 0,
  maxActiveAutomations: 0,
  ...overrides,
});

const plan = (overrides) => ({
  tagline: null,
  currency: "PKR",
  trialDays: 7,
  renewalPeriodMonths: 1,
  discountPercent: 0,
  isPromotional: false,
  isMostPopular: false,
  isRecommended: false,
  status: "active",
  supportLevel: "community",
  highlights: [],
  updatedAt: "2026-10-08T10:00:00+00:00",
  autoReplyTriggers: { greeting: false, first_message: false, unanswered: false },
  isCustom: false,
  ownerOrganisation: null,
  futureField: "ignored by the site",
  ...overrides,
});

const plans = [
  // Deliberately out of order: the site must sort by sortOrder.
  plan({
    id: "mock_scale",
    name: "Mock Scale",
    tagline: "Everything, unlimited",
    monthlyPrice: 12000,
    yearlyPrice: 120000,
    trialDays: 0,
    isRecommended: true,
    supportLevel: "dedicated",
    modules: modules({
      sales: true,
      leads: true,
      automations: true,
      ai: true,
      lead_scoring: true,
      employees: true,
    }),
    limits: limits({
      maxEmployees: null,
      maxContacts: null,
      maxCampaigns: null,
      maxWhatsAppAccounts: 5,
      maxStorageMb: null,
      dailyMessageLimit: null,
      monthlyMessageLimit: null,
      monthlyAiReplyLimit: 5000,
      maxSearchRadiusKm: null,
      maxActiveAutomations: null,
    }),
    highlights: ["Unlimited contacts"],
    autoReplyTriggers: { greeting: true, first_message: true, unanswered: true },
    sortOrder: 3,
  }),
  plan({
    id: "mock_starter",
    name: "Mock Starter",
    tagline: "For trying things out",
    monthlyPrice: 2000,
    yearlyPrice: 24000,
    modules: modules(),
    limits: limits(),
    sortOrder: 1,
  }),
  plan({
    id: "mock_growth",
    name: "Mock Growth",
    tagline: "For growing teams",
    monthlyPrice: 5000,
    yearlyPrice: 48000,
    trialDays: 14,
    isMostPopular: true,
    isPromotional: true,
    discountPercent: 10,
    supportLevel: "email",
    modules: modules({ sales: true, leads: true, automations: true, employees: true }),
    limits: limits({
      maxEmployees: 5,
      maxContacts: 10000,
      maxCampaigns: null,
      maxStorageMb: 5120,
      maxSearchRadiusKm: 5,
      maxActiveAutomations: 3,
    }),
    highlights: ["Shared inbox", "Catalog links"],
    sortOrder: 2,
  }),
];

const customOffer = {
  enabled: true,
  currency: "PKR",
  startingMonthlyPrice: 3000,
  startingYearlyPrice: 30600,
  yearlyDiscountPercent: 15,
  trialDays: 14,
  includedModules: ["whatsapp", "crm"],
  modulePrices: { sales: 1500, leads: 1000, automations: 2500, ai: 3000, unknown_module: 99 },
};

const disabledOffer = {
  enabled: false,
  currency: "PKR",
  startingMonthlyPrice: 0,
  startingYearlyPrice: 0,
  yearlyDiscountPercent: 0,
  trialDays: 0,
  includedModules: [],
  modulePrices: {},
};

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

const envelope = (data) => ({ data, message: null, traceId: "00-mock-trace" });

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "POST" && url.pathname.startsWith("/__mode/")) {
    mode = url.pathname.slice("/__mode/".length);
    return send(res, 200, { mode });
  }
  if (url.pathname === "/health") return send(res, 200, { ok: true, mode });

  if (mode === "down") {
    return send(
      res,
      503,
      { type: "about:blank", title: "Service Unavailable", status: 503, traceId: "00-mock-down" },
      "application/problem+json",
    );
  }

  if (url.pathname === "/api/v1/public/plans") {
    return send(res, 200, envelope(mode === "empty" ? [] : plans));
  }
  if (url.pathname === "/api/v1/public/custom-plan") {
    return send(res, 200, envelope(mode === "custom-off" ? disabledOffer : customOffer));
  }
  return send(
    res,
    404,
    { type: "about:blank", title: "Not Found", status: 404 },
    "application/problem+json",
  );
}).listen(PORT, "127.0.0.1", () => {
  console.log(`mock NextReach API on http://127.0.0.1:${PORT} (mode: ${mode})`);
});

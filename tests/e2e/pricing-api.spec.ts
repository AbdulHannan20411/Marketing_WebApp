import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { E2E_REVALIDATE_SECRET, MOCK_API_URL } from "../../playwright.config";
import { appUrl, expectedCustomPlanHref, expectedPricingHref, siteUrl } from "./support/site-mode";

/*
 * Pricing page against a mock NextReach API. Each test switches the mock's mode and
 * refreshes prices through the real /api/revalidate-pricing route, exactly as an
 * operator would after changing prices.
 */
test.describe.configure({ mode: "serial" });

async function useApi(request: APIRequestContext, mode: "up" | "down" | "empty" | "custom-off") {
  const switched = await request.post(`${MOCK_API_URL}/__mode/${mode}`);
  expect(switched.ok()).toBe(true);
  const refreshed = await request.post("/api/revalidate-pricing", {
    headers: { "x-revalidate-secret": E2E_REVALIDATE_SECRET },
  });
  expect(refreshed.status()).toBe(200);
}

async function planNames(page: Page) {
  return page.locator('[id^="plan-"]').allTextContents();
}

async function jsonLd(page: Page) {
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  return JSON.parse(raw ?? "{}") as {
    "@type": string;
    offers: { name: string; price: number; url: string }[];
  };
}

test.afterAll(async ({ request }) => {
  // Leave the mock down, the default other tests expect.
  await useApi(request, "down");
});

test("the revalidate route rejects requests without the secret", async ({ request }) => {
  expect((await request.post("/api/revalidate-pricing")).status()).toBe(401);
  expect(
    (
      await request.post("/api/revalidate-pricing", { headers: { "x-revalidate-secret": "wrong" } })
    ).status(),
  ).toBe(401);
});

test("live plans: order, badges, toggle, comparison, custom plan and JSON-LD", async ({
  page,
  request,
}) => {
  await useApi(request, "up");
  await page.goto("/en/pricing");

  await expect(page.getByText("Prices may have changed")).toHaveCount(0);
  // Sorted by sortOrder, not the API's array order.
  expect(await planNames(page)).toEqual(["Mock Starter", "Mock Growth", "Mock Scale"]);

  const growth = page.getByRole("article").filter({ has: page.locator("#plan-mock_growth") });
  const scale = page.getByRole("article").filter({ has: page.locator("#plan-mock_scale") });
  await expect(growth.getByText("Most popular")).toBeVisible();
  await expect(growth.getByText("10% off")).toBeVisible();
  await expect(scale.getByText("Recommended")).toBeVisible();

  // CTAs go to the app (or the query form while it isn't live); "Get started" when there is no trial.
  const growthCta = growth.getByRole("link", {
    name: "Start free trial with the Mock Growth plan",
  });
  await expect(growthCta).toHaveAttribute("href", expectedPricingHref);
  await expect(
    scale.getByRole("link", { name: "Get started with the Mock Scale plan" }),
  ).toBeVisible();

  // Monthly by default.
  await expect(growth.getByText(/PKR\s5,000/)).toBeVisible();

  // Yearly: yearly price, the per-month equivalent and the saving.
  await page.getByRole("radio", { name: "Yearly" }).click();
  await expect(page.getByRole("radio", { name: "Yearly" })).toHaveAttribute("aria-checked", "true");
  await expect(growth.getByText(/PKR\s48,000/)).toBeVisible();
  await expect(growth.getByText(/≈ PKR\s4,000\/month/)).toBeVisible();
  await expect(growth.getByText("Save 20%")).toBeVisible();
  const starter = page.getByRole("article").filter({ has: page.locator("#plan-mock_starter") });
  await expect(starter.getByText(/Save \d+%/)).toHaveCount(0);

  // Keyboard: arrow keys move between the options.
  await page.getByRole("radio", { name: "Yearly" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "Monthly" })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // Comparison table.
  const table = page.getByRole("table");
  const row = (name: string) =>
    table.getByRole("row").filter({ has: page.getByRole("rowheader", { name }) });
  await expect(row("Contacts")).toContainText("Unlimited");
  await expect(row("Storage")).toContainText("2 GB");
  await expect(row("Storage")).toContainText("5 GB");
  await expect(row("Business search radius")).toContainText("Not included");
  await expect(row("Business search radius")).toContainText("Up to 10 km");
  await expect(row("Support")).toContainText("Dedicated manager");

  // Build your own plan.
  const custom = page.getByRole("region", { name: "Build your own plan" });
  await expect(custom).toContainText(/From PKR\s3,000\/month/);
  await expect(custom).toContainText(/\+PKR\s1,500\/month/);
  await expect(custom.getByRole("link", { name: /Build my plan/ })).toHaveAttribute(
    "href",
    expectedCustomPlanHref,
  );
  await page.getByRole("radio", { name: "Yearly" }).click();
  await expect(custom).toContainText(/From PKR\s30,600\/year, save 15%/);

  // Structured data reflects the live plans.
  const data = await jsonLd(page);
  expect(data["@type"]).toBe("Product");
  expect(data.offers.map((offer) => offer.name)).toEqual([
    "Mock Starter",
    "Mock Growth",
    "Mock Scale",
  ]);
  expect(data.offers[1]).toMatchObject({
    price: 5000,
    url: appUrl ? expectedPricingHref : `${siteUrl}/en/pricing`,
  });
});

test("disabled custom plan offer hides Build your own plan", async ({ page, request }) => {
  await useApi(request, "custom-off");
  await page.goto("/en/pricing");
  expect(await planNames(page)).toHaveLength(3);
  await expect(page.getByRole("region", { name: "Build your own plan" })).toHaveCount(0);
});

test("an empty plan list shows the no-plans message", async ({ page, request }) => {
  await useApi(request, "empty");
  await page.goto("/en/pricing");
  await expect(page.getByText("Plans are being updated right now.")).toBeVisible();
  expect(await planNames(page)).toHaveLength(0);
});

test("API down: fallback plans with the notice, and the page still works", async ({
  page,
  request,
}) => {
  await useApi(request, "down");
  const response = await page.goto("/en/pricing");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByText("Prices may have changed. See the app for current pricing."),
  ).toBeVisible();
  expect(await planNames(page)).toEqual(["Starter", "Growth", "Business"]);
  await expect(page.getByRole("region", { name: "Build your own plan" })).toHaveCount(0);
  const data = await jsonLd(page);
  expect(data.offers).toHaveLength(3);
});

test("Urdu pricing page renders right-to-left with live plans", async ({ page, request }) => {
  await useApi(request, "up");
  await page.goto("/ur/pricing");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("radio", { name: "سالانہ" })).toBeVisible();
  await expect(page.getByRole("table")).toContainText("لامحدود");
});

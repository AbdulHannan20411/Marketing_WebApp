import { expect, test } from "@playwright/test";

import { appUrl } from "./support/site-mode";

const pages = [
  "/",
  "/features",
  "/features/whatsapp-campaigns",
  "/features/inbox",
  "/features/crm-discovery",
  "/features/sales-leads",
  "/features/ai",
  "/features/automations",
  "/pricing",
  "/use-cases",
  "/contact",
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/refund-policy",
];

test.describe("marketing pages", () => {
  for (const locale of ["en", "ur"] as const) {
    test(`all pages render in ${locale} without horizontal scroll`, async ({ page }) => {
      for (const path of pages) {
        const url = `/${locale}${path === "/" ? "" : path}`;
        const response = await page.goto(url);
        expect(response?.status(), url).toBe(200);
        await expect(page.locator("html"), url).toHaveAttribute(
          "dir",
          locale === "ur" ? "rtl" : "ltr",
        );
        await expect(page.getByRole("heading", { level: 1 }), url).toHaveCount(1);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, url).toBeLessThanOrEqual(0);
      }
    });
  }

  test("pages have a title, description, canonical and hreflang alternates", async ({ page }) => {
    await page.goto("/ur/features/inbox");
    await expect(page).toHaveTitle(/NextReach/);
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/ur\/features\/inbox$/,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      "href",
      /\/en\/features\/inbox$/,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  });
});

test.describe("not found", () => {
  test("unknown paths show the localised 404 with the site header", async ({ page }) => {
    const response = await page.goto("/ur/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ہمیں یہ صفحہ نہیں ملا");
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("unknown feature slugs are 404", async ({ page }) => {
    const response = await page.goto("/en/features/not-a-feature");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page");
  });
});

test.describe("home", () => {
  test("hero mock-up types out the conversation", async ({ page }) => {
    await page.goto("/en");
    const figure = page.getByRole("img", { name: /customer asks about a product/ });
    await expect(figure).toBeVisible();
    // The final message appears after the typing sequence.
    await expect(figure.getByText("Love it, I'll take two")).toBeVisible({ timeout: 15_000 });
  });

  test("reduced motion shows the final state straight away", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    const figure = page.getByRole("img", { name: /customer asks about a product/ });
    await expect(figure.getByText("Love it, I'll take two")).toBeVisible({ timeout: 3_000 });
    // Scroll reveals are not hidden either.
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-reveal]")].filter(
          (element) => getComputedStyle(element).opacity !== "1",
        ).length,
    );
    expect(hidden).toBe(0);
  });

  test("pricing teaser falls back to typed plans with a notice when the API is unavailable", async ({
    page,
  }) => {
    await page.goto("/en");
    const pricing = page.locator("#pricing");
    await expect(
      pricing.getByText("Prices may have changed. See the app for current pricing."),
    ).toBeVisible();
    await expect(pricing.getByRole("heading", { level: 3 }).first()).toBeVisible();
  });

  test("module carousel moves with the next button", async ({ page, isMobile }) => {
    test.skip(isMobile, "buttons are tested on desktop; touch scrolls natively");
    await page.goto("/en");
    const carousel = page.locator('[aria-roledescription="carousel"]');
    await carousel.scrollIntoViewIfNeeded();
    const previous = carousel.getByRole("button", { name: "Previous" });
    await expect(previous).toBeDisabled();
    await carousel.getByRole("button", { name: "Next" }).click();
    await expect(previous).toBeEnabled();
  });
});

test.describe("faq", () => {
  test("search filters questions and opens the matches", async ({ page }) => {
    await page.goto("/en/faq");
    const search = page.getByRole("searchbox", { name: "Search questions" });
    await search.fill("receipt");
    await expect(page.getByRole("status")).toHaveText("2 questions match your search.");
    await expect(page.getByText("Upload your payment receipt in the app")).toBeVisible();

    await search.fill("zzzz-nothing");
    await expect(page.getByText("No questions match “zzzz-nothing”.")).toBeVisible();
  });

  test("questions are keyboard operable", async ({ page }) => {
    await page.goto("/en/faq");
    const question = page.getByRole("button", { name: "What is NextReach?" });
    await question.focus();
    await page.keyboard.press("Enter");
    await expect(question).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("calls to action", () => {
  test.skip(({ isMobile }) => isMobile, "checked once, on desktop");

  test("Start free trial goes to the app, or to the query form while it isn't live", async ({
    page,
  }) => {
    await page.goto("/en");
    const main = page.getByRole("main");
    const trial = main.getByRole("link", { name: "Start free trial" }).first();
    const header = page.getByRole("banner");

    if (appUrl) {
      await expect(trial).toHaveAttribute("href", appUrl);
      await expect(header.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
      return;
    }

    // Standalone: no app sign-in, and the trial button opens the query form on Pricing.
    await expect(header.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
    await expect(trial).toHaveAttribute("href", "/en/contact?topic=pricing");
    await trial.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /Pricing & plans/ })).toBeChecked({
      timeout: 10_000,
    });

    // Plan buttons on the Pricing page lead to the query form too.
    await page.goto("/en/pricing");
    const planLinks = page.getByRole("link", {
      name: /Start free trial with the|Get started with the/,
    });
    await expect(planLinks.first()).toHaveAttribute("href", "/en/contact?topic=pricing");
    // Without a pricing API, the plans are shown as-is (no "prices may have changed").
    await expect(page.getByText("Prices may have changed")).toHaveCount(0);
  });
});

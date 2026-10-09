import { expect, test } from "@playwright/test";

test.describe("foundation", () => {
  test("redirects / to the English home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("renders Urdu right-to-left with Urdu copy", async ({ page }) => {
    await page.goto("/ur");
    await expect(page.locator("html")).toHaveAttribute("lang", "ur");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/[؀-ۿ]/);
  });

  test("sends security headers", async ({ request }) => {
    const response = await request.get("/en");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });

  test("has no horizontal scroll", async ({ page }) => {
    for (const path of ["/en", "/ur"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/en");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("theme toggle switches to dark and persists across reloads", async ({ page, isMobile }) => {
    await page.goto("/en");
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("desktop header", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("language switcher keeps the page and switches to Urdu", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Change language: اردو" }).click();
    await expect(page).toHaveURL(/\/ur$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // And back, keeping the page.
    await page.goto("/ur/pricing");
    await page.getByRole("link", { name: "زبان تبدیل کریں: English" }).click();
    await expect(page).toHaveURL(/\/en\/pricing$/);
  });
});

test.describe("mobile header", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("menu opens, is keyboard-dismissable and lists the main pages", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Pricing" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("opens from the inline-end edge, which is the left side in Urdu", async ({ page }) => {
    await page.goto("/ur");
    await page.getByRole("button", { name: "مینیو کھولیں" }).click();
    const box = await page.getByRole("dialog").boundingBox();
    expect(box?.x).toBeLessThanOrEqual(1);
  });
});

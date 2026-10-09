import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  createTestUser,
  deleteQueriesByEmail,
  deleteTestUser,
  insertQuery,
  insertTeamMessage,
  supabaseConfigured,
  type TestUser,
} from "./support/supabase-admin";

/*
 * Automated WCAG 2.2 AA checks (axe-core) on every public page in both languages,
 * in light and dark themes, plus the signed-in portal and admin pages. Motion is
 * reduced so scroll reveals show their final state before scanning.
 */

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const publicPages = [
  "/",
  "/features",
  "/features/inbox",
  "/pricing",
  "/use-cases",
  "/about",
  "/faq",
  "/contact",
  "/privacy",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/does-not-exist",
];
const darkPages = ["/", "/pricing", "/contact", "/sign-in", "/faq"];

test.use({ reducedMotion: "reduce" });
// axe scans are heavy (especially colour contrast over Urdu text), so allow more time.
test.describe.configure({ timeout: 90_000 });

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    try {
      window.localStorage.setItem("nr-theme", value);
    } catch {
      // ignore
    }
  }, theme);
}

for (const locale of ["en", "ur"] as const) {
  for (const path of publicPages) {
    test(`${locale}${path} has no WCAG A/AA violations (light)`, async ({ page }) => {
      await setTheme(page, "light");
      await page.goto(`/${locale}${path === "/" ? "" : path}`);
      await page.waitForLoadState("networkidle");
      await expectNoViolations(page);
    });
  }
  for (const path of darkPages) {
    test(`${locale}${path} has no WCAG A/AA violations (dark)`, async ({ page }) => {
      await setTheme(page, "dark");
      await page.goto(`/${locale}${path === "/" ? "" : path}`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("html")).toHaveClass(/dark/);
      await expectNoViolations(page);
    });
  }
}

test("the query dialog has no violations", async ({ page }) => {
  await page.goto("/en/pricing");
  await page.getByRole("link", { name: "Ask about pricing" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoViolations(page);
});

test.describe("signed-in areas", () => {
  test.skip(!supabaseConfigured, "Supabase is not configured");
  test.skip(({ isMobile }) => isMobile, "runs once, on desktop");
  test.describe.configure({ mode: "serial" });

  let admin: TestUser | undefined;
  let email = "";
  let queryId = "";

  test.beforeAll(async () => {
    admin = await createTestUser({ fullName: "A11y Admin", superadmin: true });
    email = admin.email;
    const query = await insertQuery({ email, customerId: admin.id, withAttachment: true });
    queryId = query.id;
    await insertTeamMessage(queryId, admin.id, "Thanks, we will call you tomorrow.");
    await insertTeamMessage(queryId, admin.id, "Internal: check payment.", true);
  });

  test.afterAll(async () => {
    if (email) await deleteQueriesByEmail(email);
    await deleteTestUser(admin);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`portal and admin pages have no violations (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(`/en/sign-in?next=${encodeURIComponent("/en/account")}`);
      await page.getByLabel("Email", { exact: true }).fill(admin!.email);
      await page.getByLabel("Password", { exact: true }).fill(admin!.password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page).toHaveURL(/\/en\/account$/, { timeout: 15_000 });

      for (const path of [
        "/en/account",
        `/en/account/queries/${queryId}`,
        "/en/account/profile",
        "/en/admin",
        "/en/admin/queries",
        `/en/admin/queries/${queryId}`,
        "/en/admin/customers",
        "/en/admin/saved-replies",
        "/en/admin/settings",
        "/ur/admin/queries",
      ]) {
        await test.step(path, async () => {
          await page.goto(path);
          // Live pages keep a realtime connection open, so wait for content, not idle.
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expectNoViolations(page);
        });
      }
    });
  }
});
